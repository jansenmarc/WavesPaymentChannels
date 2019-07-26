# Waves Platform Payment Channels

One of the most significant and most cited problems of current blockchain implementations is scalability. Here,
a major strategy is to offload transactions from the major blockchain network, which still cryptographically
secure the transfers in a way. The most prominent way of doing this, is payment channels, as used, e.g., in
the Bitcoin Lightning network. The major idea of payment channels is that two parties agree on a certain
amount of funds that can be exchanged via the payment channel, cryptographically secured, so that every party
can be sure that it could close the channel at any point in time and receive the current distribution of the
funds of the channel that belongs to him.

## Usecases
There are a couple of different use cases in which payment channels might be of interest. In general, every transfer
between two parties that do more than one stransfer between each other, can be done via a payment channel. Therefore,
popular usecases are:
1. Micro Payments: if two parties do large numbers of small transactions, those micropayments can be implemented via
a payment channel for free. Only the instantiation and closing of the channel costs the regular fees.
2. Two parties agree on a certain amount of funds to be exchanged over a certain period of time. This can once be
implemented in a payment channel and then every transfer can be done if the service (or whatever the goods /
service of exchange is) is delivered.
3. Performance: payment channels are often used also to increase the performance of a blockchain network. By
cryptographically securing the funds in a payment channel, the single transactions of the payment channel do
not need to be stored on the blockchain directly, but only the initialization and closing of the channel. Afterwards,
thousands and ten-thousands of transaction can be made via the channel without using the bandwidth of the
blockchain network, while at the same time implementing a certain level of security for both participants of the
payment channel.
4. Networks of payment channels: as the Lightning network does, it is possible (based on additional implementations) to
extend payment channels also to a network of payment channels, so that, in general, every transaction can be executed
in this network, with the advantage of the low price per transaction and the increased performance.
5. ...

## Prerequisites
This implementation of Payment Channels for the Waves network is implemented in NodeJS. Therefore, for using it
a proper NodeJS installation is necessary, as described [here](https://nodejs.org/). After its installation of
NodeJS, the githup repo can be cloned by
```
git clone git@github.com:jansenmarc/WavesPaymentChannels.git
```
Afterwards, missing requirements can be installed by
```
npm install
```
from the cloned directory.

## Usage
First of all, a configuration file needs to be created on both ends of the payment channel. Therefore, users have to
exchange their public keys. See the example_config.json file for further details of the configuration file.

### Setting up a payment channel
One of the users who participate in a payment channel can set up the payment channel via the following command:
```
node paymentChannels.js --setup --config=config.json
```
