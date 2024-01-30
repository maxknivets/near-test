import { utils } from "near-api-js";
import { sha256 } from "js-sha256";
import * as borsh from "borsh";

// Guide taken from https://docs.near.org/develop/integrate/backend-login#2-ask-the-user-to-sign-the-challenge
// Need help with verifySignature function
// ! HELPME Q1. What is Payload? Where to get it
// const payload = new Payload({
//   message: MESSAGE,
//   nonce: CHALLENGE,
//   recipient: APP,
//   callbackUrl: cURL,
// });
// ! HELPME Q2. What is payloadSchema and is it near/borsh-js?
// const borsh_payload = borsh.serialize(payloadSchema, payload);
// ! HELPME Q3. On My Near Wallet, signature fails with an error:
// ! "Array length (random number) does not match schema length 32 at value.nonce for my-near-wallet"

async function authenticate(
  message: string,
  accountId: string,
  publicKey: string,
  nonce: string,
  signature: string
) {
  // A user is correctly authenticated if:
  // - The key used to sign belongs to the user and is a Full Access Key
  // - The object signed contains the right message and domain

  const full_key_of_user = await verifyFullKeyBelongsToUser(
    publicKey,
    accountId,
  );
  const valid_signature = verifySignature(
    message,
    nonce,
    accountId,
    publicKey,
    signature
  );
  return valid_signature && full_key_of_user;
}

function verifySignature(
  message: string,
  nonce: string,
  recipient: string,
  publicKey: string,
  signature: string
) {
  // Reconstruct the payload that was **actually signed**
  const decodedNonce = Buffer.from(nonce, "hex");

  const payload = {
    // The tag's value is a hardcoded value as per
    // defined in the NEP [NEP413](https://github.com/near/NEPs/blob/master/neps/nep-0413.md)
    tag: 2147484061,
    message,
    nonce: decodedNonce,
    recipient,
  };

  const borsh_schema = {
    struct: {
      tag: 'u32',
      message: 'string',
      nonce: { array: { type: 'u8', len: 32 } },
      recipient: 'string',
      callbackUrl: { option: 'string' },
    },
  };

  const borsh_payload = borsh.serialize(borsh_schema, payload);
  const to_sign = Uint8Array.from(sha256.array(borsh_payload));

  // Reconstruct the signature from the parameter given in the URL
  let real_signature = Buffer.from(signature, "base64");

  // Use the public Key to verify that the private-counterpart signed the message
  const myPK = utils.PublicKey.from(publicKey);
  return myPK.verify(to_sign, real_signature);
}

async function verifyFullKeyBelongsToUser(
  publicKey: string,
  accountId: string
) {
  // Call the public RPC asking for all the users' keys
  let data = await fetch_all_user_keys(accountId);

  // if there are no keys, then the user could not sign it!
  if (!data || !data.result || !data.result.keys) return false;

  // check all the keys to see if we find the used_key there
  for (const k in data.result.keys) {
    if (data.result.keys[k].public_key === publicKey) {
      // Ensure the key is full access, meaning the user had to sign
      // the transaction through the wallet
      return data.result.keys[k].access_key.permission == "FullAccess";
    }
  }

  return false; // didn't find it
}

// Aux method
async function fetch_all_user_keys(accountId: string) {
  const keys = await fetch("https://rpc.mainnet.near.org", {
    method: "post",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: `{"jsonrpc":"2.0", "method":"query", "params":["access_key/${accountId}", ""], "id":1}`,
  })
    .then((data) => data.json())
    .then((result) => result);
  return keys;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, accountId, publicKey, nonce, signature } = body;
  const isAuthed = await authenticate(
    message,
    accountId,
    publicKey,
    nonce,
    signature
  );
  return new Response("hello world, boolean: " + isAuthed);
}
