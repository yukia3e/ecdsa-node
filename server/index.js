const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");
app.use(cors());
app.use(express.json());

const balances = {
  "032b2605e0b0672d7c3dd44fc288a754c6e7c04f0389557a60467669ea5dde2fb7": 100,
  "02a606e508cffd31b10ef0d007b5cae2b2c204ecef408300b08bc24d1baed55a8e": 50,
  "026e35f444665e58f70e529f96a73365583cbc1052c878ab50b0369bea70de2772": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  try {
    const { sender, recipient, amount, signature, publicKey } = req.body;

    const messageHash = keccak256(
      utf8ToBytes(
        JSON.stringify({
          from: sender,
          to: recipient,
          amount: parseInt(amount),
        })
      )
    );

    const isSigned = secp256k1.verify(signature, messageHash, publicKey);

    if (isSigned) {
      if (sender === publicKey) {
        setInitialBalance(sender);
        setInitialBalance(recipient);

        if (balances[sender] < amount) {
          res.status(400).send({ message: "Not enough funds!" });
        } else {
          balances[sender] -= amount;
          balances[recipient] += amount;
          res.send({ balance: balances[sender] });
        }
      } else {
        console.error("Invalid signature!");
        res.status(400).send({ message: "Invalid signature!" });
      }
    } else {
      res.status(400).send({ message: "sender and publicKey do not match!" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
