#!/usr/local/bin/node

const { setScript, transfer, data, invokeScript, broadcast, waitForTx } = require('@waves/waves-transactions');
const request = require('request');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger();
const SeedAdapter = require('@waves/signature-adapter');
const wavesCrypto = require('@waves/waves-crypto');

var configFile;
var node;

logger.level = 'debug';


const createSmartContractSource = function(callback) {
    const scriptSource = fs.readFileSync('paymentChannel.ride').toString('utf8');

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

        callback(compiledScript);
    });
};

const signSetScriptTx = function(seed, compiledScript, callback) {
    logger.info('Signing the set script transaction...');

    const params = {
        script: compiledScript
    };
    if (configFile.network == "testnet") {
        params.chainId = 84;
    }
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

    // deployment of script (1000000) + call to init (900000)
    const fundingAmount = 1000000 + 900000;
    const transferParams = {
        recipient: address,
        amount: fundingAmount
    };
    const signedTransferTx = transfer(transferParams, seed);

    broadcast(signedTransferTx, configFile.node).then(function(tx) {
        logger.info('Waiting for funds to arrive at payment channel address...');

        waitForTx(tx.id, {
            timeout: 120000,
            apiBase: configFile.node
        }).then(function() {
            callback(signedTransferTx.senderPublicKey);
        });
    });
};

const fundPaymentChannelByUser = function(amount) {
    logger.info('Funding the payment channel by user...');

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        var adapter;
        if (configFile.network == "testnet") {
            adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
        } else {
            new SeedAdapter.SeedAdapter(configFile.seed);
        }
        const address = adapter.seed.address;

        getDataEntryForAddress(address, 'pc_' + recipient, function(paymentChannelAddress) {
            const params = {
                dApp: paymentChannelAddress,
                call: {
                    function: "fund",
                    args: [ ]
                },
                payment: [ { amount: amount, asset: null } ]
            };
            if (configFile.network == "testnet") {
                params.chainId = 84;
            }
            const signedInvokeScriptTx = invokeScript(params, configFile.seed);
            logger.info('Calling fund method...');
            broadcast(signedInvokeScriptTx, configFile.node);
        });
    });
};

const getDataEntryForAddress = function(address, key, callback) {
    logger.info('Getting data entry for address...');

    request.get(configFile.node + '/addresses/data/' + address + '/' + key, function(err, response, body) {
        const dataElement = JSON.parse(body);

        if (dataElement.error) {
            getAddressFromPublicKey(configFile.secondAddressPublicKey, function(secondAddress) {
                getDataEntryForAddress(secondAddress, 'pc_' + address, function(paymentChannelAddress) {
                    createDataTransactionForFunder(secondAddress, paymentChannelAddress, function(signedDataTransaction) {
                        logger.info('Broadcasting data entry for funder...');
                        broadcast(signedDataTransaction, configFile.node).then(function(tx) {
                            waitForTx(tx.id, {
                                timeout: 120000,
                                apiBase: configFile.node
                            }).then(function() {
                                callback(paymentChannelAddress);
                            });
                        });
                    });
                });
            });
        } else {
            callback(dataElement.value);
        }
    });
};

const createDataTransactionForFunder = function(secondAddress, paymentChannelAddress, callback) {
    logger.info('Creating data transaction for funder storing payment channel...');

    const params = {
        data: [
            { key: 'pc_' + secondAddress, value: paymentChannelAddress }
        ]
    };
    const signedDataTransaction = data(params, configFile.seed);

    callback(signedDataTransaction);
};

const createInitPaymentChannelInvokeTransaction = function(seed, paymentChannelAddress, firstAddress, firstPublicKey, secondAddress, secondPublicKey, timelockPeriod, callback) {
    logger.info('Creating invoke script tx for initiation of the payment channel...');

    const params = {
        dApp: paymentChannelAddress,
        call: {
            function: "init",
            args: [
                { type: "string", value: firstPublicKey },
                { type: "string", value: secondPublicKey },
                { type: "integer", value: timelockPeriod }
            ],
            payment: [ ]
        },
        fee: 900000
    };
    if (configFile.network == "testnet") {
        params.chainId = 84;
    }
    const signedInvokeScriptTx = invokeScript(params, seed);

    callback(signedInvokeScriptTx);
};

const setupPaymentChannel = function(secondAddressPublicKey) {
    const amount = 100000000;

    createRandomSeed(function(seed) {
        createSmartContractSource(function(smartScriptSource) {
            compileScript(smartScriptSource, function(compiledScript) {
                signSetScriptTx(seed, compiledScript, function(signedSetScriptTx) {
                    getAddressFromPublicKey(signedSetScriptTx.senderPublicKey, function(paymentChannelAddress) {
                        fundPaymentChannel(paymentChannelAddress, amount, configFile.seed, function(fundingAddressPublicKey) {
                            logger.info('Sending payment channel script...');
                            broadcast(signedSetScriptTx, configFile.node).then(function(tx) {
                                logger.info('Waiting for setting payment channel script...');
                                waitForTx(tx.id, {
                                    timeout: 120000,
                                    apiBase: configFile.node
                                }).then(function() {
                                    getAddressFromPublicKey(secondAddressPublicKey, function(secondAddress) {
                                        getAddressFromPublicKey(fundingAddressPublicKey, function(fundingAddress) {
                                            createDataTransactionForFunder(secondAddress, paymentChannelAddress, function(signedDataTx) {
                                                broadcast(signedDataTx, configFile.node).then(function() {
                                                    createInitPaymentChannelInvokeTransaction(seed, paymentChannelAddress, fundingAddress, fundingAddressPublicKey, secondAddress, secondAddressPublicKey, 10, function(signedInitTx) {
                                                        broadcast(signedInitTx, configFile.node).then(function(tx) {
                                                            logger.info('Waiting for invoking init function on payment channel script...');
                                                            waitForTx(tx.id, {
                                                                timeout: 120000,
                                                                apiBase: configFile.node
                                                            }).then(function() {
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
                    });
                });
            });
        });
    });
};

const showAvailablePaymentChannels = function() {
    logger.info('Retrieving Payment Channels...');

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(senderAddress) {
        request.get(configFile.node + '/addresses/data/' + senderAddress, function(err, response, body) {
            const dataEntries = JSON.parse(body);

            dataEntries.forEach(function(dataEntry) {
                if (dataEntry.key.startsWith('pc_')) {
                    const paymentChannelAddress = dataEntry.value;

                    request.get(configFile.node + '/addresses/balance/' + paymentChannelAddress, function(err, response, body) {
                        const balanceEntry = JSON.parse(body);
                        const balance = balanceEntry.balance;
                        const recipientAddress = dataEntry.key.substring(3);
                        const payment = transfersAlreadyDone(senderAddress, recipientAddress);
                        const senderAmount = payment[senderAddress];
                        const receiverAmount = payment[recipientAddress];

                        if (balance > 0) {
                            console.log(senderAddress + '(me, ' + senderAmount + ') <-> ' + recipientAddress + ' (' + receiverAmount + ') = ' + balance);
                        }
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
                const paymentChannelAddress = dataEntry.value;


                request.get(configFile.node + '/addresses/balance/' + paymentChannelAddress, function(err, response, body) {
                    const balanceEntry = JSON.parse(body);
                    const balance = balanceEntry.balance;

                    callback(paymentChannelAddress, balance);
                });
            }
        });
    });
};

const pay = function(recipient, amount) {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const sender = adapter.seed.address;
    const timestamp = Date.now();

    getPaymentChannel(sender, recipient, function(paymentChannnelAddress, funds) {
        var transfer = transfersAlreadyDone(sender, recipient);

        request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'firstAddress', function(err, response, body) {
            const firstAddress = JSON.parse(body).value;

            request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'secondAddress', function(err, response, body) {
                const secondAddress = JSON.parse(body).value;
                var stringToSign;

                if (transfer) {
                    const senderAmount = transfer[sender] - amount;
                    const recipientAmount = transfer[recipient] + amount;

                    if (senderAmount >= 0 && recipientAmount >= 0) {
                        transfer[sender] = senderAmount;
                        transfer[recipient] = recipientAmount;
                        transfer['timestamp'] = timestamp;
                        stringToSign = firstAddress + transfer[firstAddress] + secondAddress + transfer[secondAddress] + timestamp;
                        adapter.signData(Buffer.from(stringToSign)).then(function(signedString) {
                            transfer['signature'] = signedString;
                            storeSignedTransaction(sender, recipient, transfer);
                        });
                    } else {
                        logger.error('Transfer would lead to negative amounts at sender!');
                    }
                } else {
                    transfer = {};
                    request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + (sender + '_amount'), function(err, response, body) {
                        const senderAmountDataElement = JSON.parse(body);
                        const sendersFunds = senderAmountDataElement.value;

                        request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + (recipient + '_amount'), function(err, response, body) {
                            const dataElement = JSON.parse(body);
                            const senderAmount = sendersFunds - amount;
                            const recipientAmount = dataElement.value + amount;

                            if (senderAmount >= 0 && recipientAmount >= 0) {
                                transfer[sender] = senderAmount;
                                transfer[recipient] = recipientAmount;
                                transfer['timestamp'] = timestamp;
                                stringToSign = firstAddress + transfer[firstAddress] + secondAddress + transfer[secondAddress] + timestamp;
                                adapter.signData(Buffer.from(stringToSign)).then(function(signedString) {
                                    transfer['signature'] = signedString;
                                    storeSignedTransaction(sender, recipient, transfer);
                                });
                            } else {
                                logger.error('Transfer would lead to negative amounts at sender!');
                            }
                        });
                    });
                }
            });
        });
    });
};

const transfersAlreadyDone = function(sender, recipient) {
    const filename = sender + '_' + recipient + '.json';
    const alternativeFilename = recipient + '_' + sender + '.json';
    var transaction = null;

    if (fs.existsSync(filename)) {
        transaction = require('./' + filename);
    } else if (fs.existsSync(alternativeFilename)) {
        transaction = require('./' + alternativeFilename);
    }

    return transaction;
};

const sign = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const sender = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        getPaymentChannel(sender, recipient, function(paymentChannnelAddress, funds) {
            request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'firstAddress', function (err, response, body) {
                const firstAddress = JSON.parse(body).value;

                request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'secondAddress', function (err, response, body) {
                    const secondAddress = JSON.parse(body).value;
                    var transaction = transfersAlreadyDone(sender, recipient);
                    var stringToSign = firstAddress + transaction[firstAddress] + secondAddress + transaction[secondAddress] + transaction['timestamp'];

                    adapter.signData(Buffer.from(stringToSign)).then(function(signedString) {
                        transaction['signature'] = signedString;
                        storeSignedTransaction(sender, recipient, transaction);
                    });
                });
            });
        });
    });
};

const checkSignature = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const sender = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        getPaymentChannel(sender, recipient, function(paymentChannnelAddress, funds) {
            request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'firstAddress', function (err, response, body) {
                const firstAddress = JSON.parse(body).value;

                request.get(configFile.node + '/addresses/data/' + paymentChannnelAddress + '/' + 'secondAddress', function (err, response, body) {
                    const secondAddress = JSON.parse(body).value;
                    var transaction = transfersAlreadyDone(sender, recipient);
                    var stringToSign = firstAddress + transaction[firstAddress] + secondAddress + transaction[secondAddress] + transaction['timestamp'];
                    var isSignatureCorrect = wavesCrypto.verifySignature(configFile.secondAddressPublicKey, Buffer.from(stringToSign), transaction.signature);

                    if (isSignatureCorrect) {
                        logger.info('Transaction successfully signed by: ' + recipient);
                    } else {
                        logger.info('Wrong signature!');
                    }
                });
            });
        });
    });
};

const storeSignedTransaction = function(sender, recipient, signedTransaction) {
    logger.info('Storing signed transaction...');
    const filename = sender + '_' + recipient + '.json';
    const alternativeFilename = recipient + '_' + sender + '.json';

    if (fs.existsSync(alternativeFilename)) {
        fs.writeFileSync(alternativeFilename, JSON.stringify(signedTransaction, null, 4), 'utf8');
    } else {
        fs.writeFileSync(filename, JSON.stringify(signedTransaction, null, 4), 'utf8');
    }
};

const getLatestTransactionForChannel = function(address, recipient, callback) {
    const filename = address + '_' + recipient + '.json';
    const alternativeFilename = recipient + '_' + address + '.json';
    var transaction;

    if (fs.existsSync(filename)) {
        transaction = require('./' + filename);
    } else if (fs.existsSync(alternativeFilename)) {
        transaction = require('./' + alternativeFilename);
    }

    callback(transaction);
};

const confirmClose = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const address = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        logger.info('Confirm closing of the payment between ' + address + ' and ' + recipient + '...');

        request.get(configFile.node + '/addresses/data/' + address + '/pc_' + recipient, function(err, response, body) {
            const paymentChannelAddress = JSON.parse(body).value;

            const params = {
                dApp: paymentChannelAddress,
                call: {
                    function: "confirmClose",
                    args: [ ]
                },
                payment: [ ]
            };
            if (configFile.network == "testnet") {
                params.chainId = 84;
            }
            const signedInvokeScriptTx = invokeScript(params, configFile.seed);
            logger.info('Calling initiateClosing method with tx id: ' + signedInvokeScriptTx.id);
            broadcast(signedInvokeScriptTx, configFile.node);
        });
    });
};

const initiateClosing = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const address = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        logger.info('Closing the payment channel between ' + address + ' and ' + recipient + '...');
        request.get(configFile.node + '/addresses/data/' + address + '/pc_' + recipient, function(err, response, body) {
            const paymentChannelAddress = JSON.parse(body).value;
            getLatestTransactionForChannel(address, recipient, function(transaction) {
                const firstAddress = Object.keys(transaction)[0];
                const secondAddress = Object.keys(transaction)[1];

                const params = {
                    dApp: paymentChannelAddress,
                    call: {
                        function: "initialClosing",
                        args: [
                            { type: "string", value: firstAddress},
                            { type: "integer", value: transaction[firstAddress]},
                            { type: "string", value: secondAddress},
                            { type: "integer", value: transaction[secondAddress]},
                            { type: "integer", value: transaction.timestamp },
                            { type: "string", value: transaction.signature }
                        ]
                    },
                    payment: [ ]
                };
                if (configFile.network == "testnet") {
                    params.chainId = 84;
                }
                const signedInvokeScriptTx = invokeScript(params, configFile.seed);
                broadcast(signedInvokeScriptTx, configFile.node);
            });
        });
    });
};

const confirmCloseAfterTimelock = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const address = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        logger.info('Closing payment channel between ' + address + ' and ' + recipient + ' after timelock...');

        request.get(configFile.node + '/addresses/data/' + address + '/pc_' + recipient, function(err, response, body) {
            const paymentChannelAddress = JSON.parse(body).value;

            const params = {
                dApp: paymentChannelAddress,
                call: {
                    function: "closeAfterTimelock",
                    args: [ ]
                },
                payment: [ ]
            };
            if (configFile.network == "testnet") {
                params.chainId = 84;
            }
            const signedInvokeScriptTx = invokeScript(params, configFile.seed);
            logger.info('Calling closeAfterTimelock method with tx id: ' + signedInvokeScriptTx.id);
            broadcast(signedInvokeScriptTx, configFile.node);
        });
    });
};

const claimCheating = function() {
    var adapter;
    if (configFile.network == "testnet") {
        adapter = new SeedAdapter.SeedAdapter(configFile.seed, 'T');
    } else {
        new SeedAdapter.SeedAdapter(configFile.seed);
    }
    const address = adapter.seed.address;

    getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
        logger.info('Claiming all funds of payment channel between ' + address + ' and ' + recipient + '...');
        request.get(configFile.node + '/addresses/data/' + address + '/pc_' + recipient, function(err, response, body) {
            const paymentChannelAddress = JSON.parse(body).value;
            getLatestTransactionForChannel(address, recipient, function(transaction) {
                const firstAddress = Object.keys(transaction)[0];
                const secondAddress = Object.keys(transaction)[1];

                const params = {
                    dApp: paymentChannelAddress,
                    call: {
                        function: "claimCheating",
                        args: [
                            { type: "string", value: firstAddress},
                            { type: "integer", value: transaction[firstAddress]},
                            { type: "string", value: secondAddress},
                            { type: "integer", value: transaction[secondAddress]},
                            { type: "integer", value: transaction.timestamp },
                            { type: "string", value: transaction.signature }
                        ]
                    },
                    payment: [ ]
                };
                if (configFile.network == "testnet") {
                    params.chainId = 84;
                }
                const signedInvokeScriptTx = invokeScript(params, configFile.seed);
                broadcast(signedInvokeScriptTx, configFile.node);
            });
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
                    description: 'Setting up a new Payment Channel to an address (represented by its public key) as configured in the config file.'
                },
                {
                    name: 'fund',
                    typeLabel: '{underline amount}',
                    description: 'Funding a payment channel.'
                },
                {
                    name: 'pay',
                    description: 'Paying a recipient via a Payment Channel.'
                },
                {
                    name: 'amount',
                    typeLabel: '{underline amount}',
                    description: 'The total amount available in this Payment Channel (only valid for --setup and --pay).'
                },
                {
                    name: 'initiateClosing',
                    description: 'Initiate closing the payment channel to a defined recipient.'
                },
                {
                    name: 'confirmClosing',
                    description: 'Confirm closing of a payment channel for which closing was initiated.'
                },
                {
                    name: 'confirmCloseAfterTimelock',
                    description: 'Confirm closing of a payment channel after timelock.'
                },
                {
                    name: 'claimCheating',
                    description: 'Claim all funds of a payment channel for the other party trying to cheat.'
                },
                {
                    name: 'list',
                    description: 'List available Payment Channels for the configured address.'
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.'
                },
                {
                    name: 'sign',
                    description: 'Signing an existing transaction with a new private key.'
                },
                {
                    name: 'checkSignature',
                    description: 'Checking the signature of a transaction in a payment channel.'
                }
            ]
        }
    ]
    const usage = commandLineUsage(sections)
    console.log(usage)
};

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'setup', alias: 's', type: Boolean },
    { name: 'config', alias: 'g', type: String },
    { name: 'fund', alias: 'f', type: Boolean },
    { name: 'amount', alias: 'a', type: Number },
    { name: 'pay', alias: 'p', type: Boolean },
    { name: 'initiateClosing', alias: 'i', type: Boolean },
    { name: 'confirmClosing', alias: 'c', type: Boolean },
    { name: 'confirmCloseAfterTimelock', alias: 't', type: Boolean },
    { name: 'claimCheating', alias: 'H', type: Boolean },
    { name: 'list', alias: 'l', type: Boolean },
    { name: 'sign', alias: 'S', type: Boolean },
    { name: 'checkSignature', alias: 'C', type: Boolean }
];
const options = commandLineArgs(optionDefinitions);

if (!options.config) {
    printHelpMessage();
} else {
    configFile = require('./' + options.config);
    node = configFile.node;

    if (options.setup) {
        logger.info('Setting up a new payment channel...');
        const recipientPublicKey = configFile.secondAddressPublicKey;

        setupPaymentChannel(recipientPublicKey);
    } else if (options.help) {
        printHelpMessage();
    } else if (options.fund) {
        const amount = options.amount;

        fundPaymentChannelByUser(amount);
    } else if (options.pay) {
        logger.info('Paying...');
        getAddressFromPublicKey(configFile.secondAddressPublicKey, function(recipient) {
            const amount = options.amount;

            pay(recipient, amount);
        });
    } else if (options.initiateClosing) {
        initiateClosing();
    } else if (options.confirmClosing) {
        confirmClose();
    } else if (options.confirmCloseAfterTimelock) {
        confirmCloseAfterTimelock();
    } else if (options.claimCheating) {
        claimCheating();
    } else if (options.list) {
        showAvailablePaymentChannels();
    } else if (options.help) {
        printHelpMessage();
    } else if (options.sign) {
        logger.info('Signing transaction...');
        sign();
    } else if (options.checkSignature) {
        logger.info('Checking signature of transaction...');
        checkSignature();
    }
}
