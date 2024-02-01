"use client";
import axios from "axios";

import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

import type { WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useEffect, useState } from "react";
import { randomBytes } from "crypto";
import { setupSender } from "@near-wallet-selector/sender";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

export default function Home() {
  const [selector, setSelector] = useState<WalletSelector | undefined>();
  const [modal, setModal] = useState<WalletSelectorModal | undefined>();

  // Aux method
  async function fetch_all_user_keys({ accountId }: { accountId: string }) {
    const keys: any = await fetch("https://rpc.testnet.near.org", {
      method: "post",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: `{"jsonrpc":"2.0", "method":"query", "params":["access_key/${accountId}", ""], "id":1}`,
    })
      .then((data) => data.json())
      .then((result) => result);
    return keys;
  }

  useEffect(() => {
    if (!window) return;
    const createme = async () => {
      const selector = await setupWalletSelector({
        network: "mainnet",
        modules: [setupMyNearWallet(), setupSender(), setupMeteorWallet()],
      });

      const modal = setupModal(selector, {
        contractId: "maxknivets.near",
      });

      setSelector(selector);
      setModal(modal);
    };
    createme();
  }, []);

  const signMessage = async (walletName: string) => {
    const wallet = await selector?.wallet(walletName);
    // Array length 68 does not match schema length 32 at value.nonce for my-near-wallet
    const challenge = randomBytes(32);
    let nonce = challenge.toString("hex");
    let message = "Testing!";
    const accounts = await wallet?.getAccounts();
    if (accounts) {
      const signatureResult = await wallet?.signMessage({
        message,
        nonce: challenge,
        recipient: accounts[0].accountId,
        callbackUrl: "",
      });
      console.log(signatureResult);
      let accountId = signatureResult?.accountId;
      let publicKey = signatureResult?.publicKey;
      let signature = signatureResult?.signature;

      // message = Buffer.from(message).toString("base64");
      // nonce = Buffer.from(nonce).toString("base64");
      // accountId = Buffer.from(accountId || "").toString("base64");
      // publicKey = Buffer.from(publicKey || "").toString("base64");
      // signature = Buffer.from(signature || "").toString("base64");
      debugger;
      let result = await axios.get(
        `http://localhost:3000/near/signature/${
          encodeURIComponent(message) +
          "/" +
          encodeURIComponent(nonce) +
          "/" +
          encodeURIComponent(accountId || "") +
          "/" +
          encodeURIComponent(publicKey || "") +
          "/" +
          encodeURIComponent(signature || "")
        }`
      );
      // result = await axios.post("/api/user-auth", {
      //   message,
      //   nonce,
      //   accountId,
      //   publicKey,
      //   signature,
      // });
      // const result = await axios.get(
      //   `http://localhost:3000/near/signature/${
      //     mes + "/" + non + "/" + acc + "/" + pub + "/" + sig
      //   }`
      // );
      console.log(result.data);
    }
  };

  return (
    <main className="flex p-24 gap-x-4">
      <button
        className="border-2 border-black px-4 py-2"
        onClick={() => modal?.show()}
      >
        Show Modal
      </button>
      <button
        className="border-2 border-black px-4 py-2"
        onClick={() => signMessage("meteor-wallet")}
      >
        Sign Message (Meteor Wallet)
      </button>
      <button
        className="border-2 border-black px-4 py-2"
        onClick={() => signMessage("my-near-wallet")}
      >
        Sign Message (My Near Wallet)
      </button>
      <button
        className="border-2 border-black px-4 py-2"
        onClick={() => signMessage("sender")}
      >
        Sign Message (Sender)
      </button>
    </main>
  );
}
