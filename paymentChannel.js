#!/usr/local/bin/node

const { massTransfer, setScript, transfer, data } = require('@waves/waves-transactions');
const request = require('request');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger();

var configFile;
var node;

logger.level = 'debug';


const createSmartContractSource = function(recipientPublicKey, callback) {
    const scriptSource = "" +
        "let sender = base58'" + configFile.publicKey + "'\n" +
        "let recipient = base58'" + recipientPublicKey + "'\n" +
        "let timelock = 13500000\n" +
        "\n" +
        "match tx {\n" +
        "   case tx:MassTransferTransaction =>\n" +
        "       let senderSigned = if(sigVerify(tx.bodyBytes, tx.proofs[0], sender)) then 1 else 0\n" +
        "       let recipientSigned = if(sigVerify(tx.bodyBytes, tx.proofs[1], recipient)) then 1 else 0\n" +
        "       let timelockPassed = height > timelock\n" +
        "\n" +
        "       (senderSigned + recipientSigned == 2) || (timelockPassed && senderSigned == 1)\n" +
        "   case tx:SetScriptTransaction => true\n" +
        "   case _ => true\n" +
        "}\n";

    callback(scriptSource);
};

const compileScript = function(scriptSource, callback) {
    logger.info('Compiling the script...');

    request({
        uri: node + '/utils/script/compile',
        body: scriptSource,
        method: 'POST'
    }, function (err, response, body) {
        const compiledScript = JSON.parse(body).script.substring(7);
        /*const params = {
            script: compiledScript,
            chainId: 84
        };
        const signedSetScriptTx = setScript(params, seed);

        callback(signedSetScriptTx);*/
        callback(compiledScript);
    });
};

const signSetScriptTx = function(seed, compiledScript, callback) {
    logger.info('Signing the set script transaction...');

    const params = {
        script: compiledScript,
        chainId: 84
    };
    const signedSetScriptTx = setScript(params, seed);

    callback(signedSetScriptTx);
};

const getAddressFromPublicKey = function(publicKey, callback) {
    logger.info('getting address for public key...')

    request.get(node + '/addresses/publicKey/' + publicKey, function(err, response, body) {
        callback(JSON.parse(body).address);
    });
};

const createRandomSeed = function(callback) {
    logger.info('Generating a random seed...');

    const wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access',
        'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action',
        'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
        'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air',
        'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
        'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused',
        'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual',
        'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple',
        'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around',
        'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault',
        'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract',
        'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
        'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag',
        'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
        'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin',
        'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between',
        'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame',
        'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush',
        'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow',
        'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze',
        'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
        'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle',
        'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage',
        'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel',
        'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card',
        'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch',
        'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census',
        'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge',
        'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child',
        'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle',
        'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click',
        'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club',
        'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect',
        'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct',
        'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy',
        'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin',
        'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy',
        'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch',
        'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture',
        'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad',
        'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal', 'debate',
        'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define',
        'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend',
        'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair', 'destroy',
        'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel',
        'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree',
        'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce',
        'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door',
        'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill',
        'drink', 'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty',
        'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology',
        'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric',
        'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge',
        'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy',
        'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure',
        'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode', 'erosion',
        'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke',
        'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise',
        'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose',
        'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith',
        'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal',
        'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female',
        'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film',
        'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit',
        'fitness', 'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock',
        'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food',
        'foot', 'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found',
        'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown',
        'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy',
        'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate',
        'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant',
        'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide',
        'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good', 'goose',
        'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass',
        'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess',
        'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy',
        'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy',
        'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip',
        'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope',
        'horn', 'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble',
        'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea',
        'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense', 'immune',
        'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate',
        'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury',
        'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire', 'install',
        'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item',
        'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join', 'joke',
        'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep',
        'ketchup', 'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten',
        'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp',
        'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit',
        'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure',
        'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library',
        'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion', 'liquid', 'list', 'little',
        'live', 'lizard', 'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery',
        'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics',
        'machine', 'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage',
        'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market',
        'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter', 'maximum', 'maze',
        'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory',
        'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method', 'middle',
        'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery',
        'miss', 'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor',
        'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor',
        'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom',
        'music', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty',
        'nation', 'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest',
        'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee',
        'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear',
        'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain', 'obvious',
        'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive',
        'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose',
        'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan',
        'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner',
        'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic',
        'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient',
        'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican', 'pen',
        'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase',
        'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer',
        'pipe', 'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge',
        'pluck', 'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool',
        'popular', 'portion', 'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power',
        'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride',
        'primary', 'print', 'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit',
        'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public',
        'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose',
        'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit',
        'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise', 'rally',
        'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready',
        'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce',
        'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release', 'relief',
        'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat',
        'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire',
        'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich',
        'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river',
        'road', 'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate',
        'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad',
        'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand',
        'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene',
        'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea',
        'search', 'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment', 'select',
        'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup',
        'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine',
        'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug',
        'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver',
        'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski',
        'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim',
        'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snap',
        'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid',
        'solution', 'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south',
        'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice',
        'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray',
        'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs',
        'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still',
        'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong',
        'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such',
        'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply',
        'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow',
        'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol',
        'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target',
        'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term',
        'test', 'text', 'thank', 'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought',
        'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time', 'tiny',
        'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet',
        'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple',
        'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town', 'toy', 'track',
        'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree',
        'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true',
        'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey',
        'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly',
        'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy',
        'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update',
        'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless',
        'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish', 'vapor',
        'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version',
        'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view', 'village',
        'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice',
        'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want',
        'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear',
        'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what',
        'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win',
        'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf',
        'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle',
        'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone',
        'zoo'];
    const wordCount = wordList.length;
    var seed = '';

    for (var i = 0; i < 15; i++) {
        const index = Math.floor((Math.random() * wordCount));

        seed += ' ' + wordList[index];
    }
    seed = seed.substring(1);
    callback(seed);
};

const fundPaymentChannel = function(address, amount, seed, callback) {
    logger.info('Funding the payment channel...');

    // funds + tx fee for mass transfer tx to clear the payment channel + tx fee for deploying the smart contract
    const fundingAmount = amount + 600000 + 1000000;
    const transferParams = {
        recipient: address,
        amount: fundingAmount
    };
    const signedTransferTx = transfer(transferParams, seed);

    broadcastTransacton(signedTransferTx, function() {
        waitForFundsReceived(address, fundingAmount, callback)
    });
};

const waitForFundsReceived = function(address, funds, callback) {
    logger.info('Waiting for funds to arrive at payment channel address...');

    request.get(node + '/addresses/balance/' + address, function(err, response, body) {
        const balance = JSON.parse(body).balance;

        if (balance < funds) {
            setTimeout(function() {
                waitForFundsReceived(address, funds, callback)
            }, 1000);
        } else {
            callback();
        }
    });
};

const broadcastTransacton = function(signedTransaction, callback) {
    logger.info('Broadcasting transaction type ' + signedTransaction.type + '...');

    request({
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        uri: node + '/transactions/broadcast',
        body: JSON.stringify(signedTransaction),
        method: 'POST'
    }, function (err, response, body) {
        if (!err) {
            callback();
        } else {
            logger.err(err);
        }
    });
};

const createDataTransaction = function(recipientPublicKey, paymentChannelAddress, callback) {
    logger.info('Creating data transaction...');

    const params = {
        data: [
            {key: 'pc_' + recipientPublicKey, value: paymentChannelAddress}
        ]
    };
    const signedDataTransaction = data(params, configFile.seed);

    callback(signedDataTransaction);
};

const setupPaymentChannel = function(recipientPublicKey, amount) {
    createRandomSeed(function(seed) {
        createSmartContractSource(recipientPublicKey, function(smartScriptSource) {
            compileScript(smartScriptSource, function(compiledScript) {
                signSetScriptTx(seed, compiledScript, function(signedSetScriptTx) {
                    getAddressFromPublicKey(signedSetScriptTx.senderPublicKey, function(paymentChannelAddress) {
                        fundPaymentChannel(paymentChannelAddress, amount, configFile.seed, function() {
                            broadcastTransacton(signedSetScriptTx, function() {
                                getAddressFromPublicKey(recipientPublicKey, function(recipientAddress) {
                                    createDataTransaction(recipientAddress, signedSetScriptTx.senderPublicKey, function(signedDataTransaction) {
                                        broadcastTransacton(signedDataTransaction, function() {
                                            logger.info('Successfully installed payment channel at address ' + paymentChannelAddress);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

const showAvailablePaymentChannels = function() {
    logger.info('Retrieving Payment Channels...');

    getAddressFromPublicKey(configFile.publicKey, function(senderAddress) {
        request.get(configFile.node + '/addresses/data/' + senderAddress, function(err, response, body) {
            const dataEntries = JSON.parse(body);

            dataEntries.forEach(function(dataEntry) {
                if (dataEntry.key.startsWith('pc_')) {
                    const paymentChannelPublicKey = dataEntry.value;

                    getAddressFromPublicKey(paymentChannelPublicKey, function(paymentChannelAddress) {
                        request.get(configFile.node + '/addresses/balance/' + paymentChannelAddress, function(err, response, body) {
                            const balanceEntry = JSON.parse(body);
                            const balance = balanceEntry.balance - 600000;

                            if (balance > 0) {
                                console.log(senderAddress + '(me) -> ' + dataEntry.key.substring(3) + ' = ' + balance);
                            }
                        });
                    });
                }
            });
            showLocalPaymentChannel();
        });
    });
};

const showLocalPaymentChannel = function() {
    getAddressFromPublicKey(configFile.publicKey, function(address) {
        fs.readdirSync('./').forEach(function(file) {
            if (file.endsWith(address + '.json')) {
                const sourceAddress = file.substring(0, file.indexOf('_'));

                getPaymentChannel(sourceAddress, address, function(paymentChannelPublicKey, amount) {
                    console.log(sourceAddress + ' -> ' + address + '(me) = ' + amount);
                });
            }
        });
    });
};

const getPaymentChannel = function(sender, recipient, callback) {
    logger.info('getting payment channel between: ' + sender + ' and ' + recipient + '...');

    request.get(configFile.node + '/addresses/data/' + sender, function(err, response, body) {
        const dataEntries = JSON.parse(body);

        dataEntries.forEach(function(dataEntry) {
            if (dataEntry.key === 'pc_' + recipient) {
                const paymentChannelPublicKey = dataEntry.value;

                getAddressFromPublicKey(paymentChannelPublicKey, function(paymentChannelAddress) {
                    request.get(configFile.node + '/addresses/balance/' + paymentChannelAddress, function(err, response, body) {
                        const balanceEntry = JSON.parse(body);
                        const balance = balanceEntry.balance - 600000;

                        callback(paymentChannelPublicKey, balance);
                    });
                });
            }
        });
    });
};

const pay = function(recipient, amount) {
    const params = {
        transfers: [
            {
                amount: amount,
                recipient: recipient,
            },
            {
            }
        ],
        fee: 600000
    };

    getAddressFromPublicKey(configFile.publicKey, function(sender) {
        getPaymentChannel(sender, recipient, function(paymentChannelPublicKey, funds) {
            const transfer = transfersAlreadyDone(sender, recipient);

            if (transfer) {
                params.transfers[0].amount = transfer.transfers[0].amount + amount;
                params.transfers[1].amount = transfer.transfers[1].amount - amount;
                params.transfers[1].recipient = sender;
                params.senderPublicKey = paymentChannelPublicKey;
                const signedMassTransferTx = massTransfer(params, configFile.seed);

                storeSignedTransaction(sender, recipient, signedMassTransferTx);
            } else {
                params.transfers[1].recipient = sender;
                params.transfers[1].amount = funds - amount;
                params.senderPublicKey = paymentChannelPublicKey;
                const signedMassTransferTx = massTransfer(params, configFile.seed);

                storeSignedTransaction(sender, recipient, signedMassTransferTx);
            }
        });
    });
};

const transfersAlreadyDone = function(sender, recipient) {
    const filename = sender + '_' + recipient + '.json';
    var transaction = null;

    if (fs.existsSync(filename)) {
        transaction = require('./' + filename);
    }

    return transaction;
};

const storeSignedTransaction = function(sender, recipient, signedTransaction) {
    logger.info('Storing signed transaction...');

    fs.writeFileSync(sender + '_' + recipient + '.json', JSON.stringify(signedTransaction, null, 4), 'utf8');
};

const closePaymentChannel = function(source) {
    getAddressFromPublicKey(configFile.publicKey, function(address) {
        logger.info('Closing the payment between ' + source + ' and ' + address + '...');
        const filename = source + '_' + address + '.json';
        var transaction = require('./' + filename);

        transaction = massTransfer(transaction, configFile.seed);
        broadcastTransacton(transaction, function() {
            logger.info('Payment Channel closed!');
        });
    });
};

const printHelpMessage = function() {
    const sections = [
        {
            header: 'Payment Channels on the Waves platform',
            content: 'Command line interface for controlling Lightning Network like Payment Channels on the Waves Platform.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'setup',
                    description: 'Setting up a new Payment Channel to an address (represented by its public key) with the given amount.'
                },
                {
                    name: 'pay',
                    description: 'Paying a recipient via a Payment Channel.'
                },
                {
                    name: 'recipient',
                    typeLabel: '{underline address}',
                    description: 'The address of the recipient of the payment.'
                },
                {
                    name: 'amount',
                    typeLabel: '{underline amount}',
                    description: 'The total amount available in this Payment Channel (only valid for --setup and --pay).'
                },
                {
                    name: 'recipientPublicKey',
                    typeLabel: '{underline publicKey}',
                    description: 'The public key of the recipient for this Payment Channel (only valid for --setup).'
                },
                {
                    name: 'source',
                    typeLabel: '{underline address}',
                    description: 'The source address to close the Payment Channel from (only valid for --close).'
                },
                {
                    name: 'list',
                    description: 'List available Payment Channels for the configured address.'
                },
                {
                    name: 'close',
                    description: 'Closing a Payment Channel.'
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.'
                }
            ]
        }
    ]
    const usage = commandLineUsage(sections)
    console.log(usage)
};

const optionDefinitions = [
    { name: 'setup', alias: 's', type: Boolean },
    { name: 'pay', alias: 'p', type: Boolean },
    { name: 'recipient', alias: 'r', type: String},
    { name: 'recipientPublicKey', alias: 'k', type: String},
    { name: 'amount', alias: 'a', type: Number },
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'list', alias: 'l', type: Boolean },
    { name: 'close', alias: 'c', type: Boolean },
    { name: 'source', alias: 'q', type: String },
    { name: 'config', alias: 'g', type: String }
];
const options = commandLineArgs(optionDefinitions);

if (!options.config) {
    logger.error('No config file provided.');
} else {
    configFile = require('./' + options.config);
    node = configFile.node;

    if (options.setup) {
        logger.info('Setting up a new payment channel...');
        const recipientPublicKey = options.recipientPublicKey;
        const amount = options.amount;

        setupPaymentChannel(recipientPublicKey, amount);
    } else if (options.list) {
        showAvailablePaymentChannels();
    } else if (options.pay) {
        logger.info('Paying...');
        const recipient = options.recipient;
        const amount = options.amount;

        pay(recipient, amount);
    } else if (options.help) {
        printHelpMessage();
    } else if (options.close) {
        closePaymentChannel(options.source);
    } else {
        logger.info('Nothing to do!');
    }
}
