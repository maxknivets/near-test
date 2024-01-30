"use client";
import Image from "next/image";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import type { MyNearWalletParams } from "@near-wallet-selector/my-near-wallet";
import type { WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useEffect, useState } from "react";
import { randomBytes } from "crypto";
import { setupSender } from "@near-wallet-selector/sender";

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
        modules: [setupMyNearWallet(), setupSender()],
      });

      const modal = setupModal(selector, {
        contractId: "maxknivets.near",
      });

      setSelector(selector);
      setModal(modal);
    };
    createme();
  }, []);
  const verifyKEK = async () => {
    const wallet = await selector?.wallet("sender");
    //Array length 68 does not match schema length 32 at value.nonce
    const challenge = randomBytes(32);
    // const message = "Login with NEAR";
    // debugger;
    const message = "Testing!";
    const accounts = await wallet?.getAccounts();
    if (accounts)
      await wallet?.signMessage({
        message,
        nonce: challenge,
        recipient: accounts[0].accountId,
        callbackUrl: "/api/user-auth",
      });
  };

  return (
    <main className="flex p-24">
      <div>I am alive</div>
      <button onClick={() => modal?.show()}>arara</button>
      <button onClick={() => verifyKEK()}>Barararak</button>
    </main>
  );
}
