import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import * as keccak from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";
import { Buffer } from "buffer";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const messageHash = keccak.keccak256(
      utf8ToBytes(
        JSON.stringify({
          from: address,
          to: recipient,
          amount: parseInt(sendAmount),
        })
      )
    );

    const signatureObject = secp.secp256k1.sign(messageHash, privateKey);
    const signature = signatureObject.toCompactHex();

    const publicKey = toHex(secp.secp256k1.getPublicKey(privateKey));

    try {
      BigInt.prototype.toJSON = function () {
        return this.toString();
      };
      const { data } = await server.post(`send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        signature,
        publicKey,
      });
      setBalance(data.balance);
    } catch (ex) {
      alert(ex);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
