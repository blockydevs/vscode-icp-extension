import { fetchActor, render, getCycles, getNames } from "./candid";
import { renderAuth } from "./auth/auth";
import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import { Secp256k1KeyIdentity } from "./identity-secp256k1/secp256k1"
import { addEventHandlersToNewIdentitiesButtons } from "./identities"

const DEFAULT_IDENTITY_ACCOUNTS_NUMBER = 10;
export const DEFAULT_SEED_PHRASE = "during nut robust trouble drip question series endless hurry upper track cost time bone crunch gorilla cause peasant fantasy prison banana toy toward mean";
export const DERIVATION_PATH = "m/44'/223'/0'/0/"
let actor: ActorSubclass | undefined;
export let identities: Array<Secp256k1KeyIdentity> = new Array();
export let selectedIdentity: Secp256k1KeyIdentity = Secp256k1KeyIdentity.generate();

async function main() {
  const params = new URLSearchParams(window.location.search);
  const cid = params.get("id");
  if (!cid) {
    document.body.innerHTML = `<div class="provide-canister-page">
    <label>Provide a canister ID: </label>
    <input id="id" type="text"><br>
    <label>Choose a did file (optional) </label>
    <input id="did" type="file" accept=".did"><br>
    <button id="btn" class="btn">Go</button>
    </div>
    `;
    const id = (document.getElementById("id") as HTMLInputElement)!;
    const did = (document.getElementById("did")! as HTMLInputElement)!;
    const btn = document.getElementById("btn")!;
    btn.addEventListener("click", () => {
      params.set("id", id.value);
      if (did.files!.length > 0) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          const encoded = reader.result as string;
          const candid = encoded.substr(encoded.indexOf(",") + 1);
          // update URL with Candid data and refresh
          window.history.pushState({}, "", window.location.search);
          window.history.pushState({ candid }, "", `?${params}`);
          window.location.reload();
        });
        reader.readAsDataURL(did.files![0]);
      } else {
        window.location.href = `?${params}`;
      }
    });
  } else {
    document.title = `Canister ${cid}`;
    const canisterId = Principal.fromText(cid);
    const profiling = await getCycles(canisterId);
    let identity = await populateIdentities(canisterId);
    actor = await fetchActor(canisterId, identity);
    await addEventHandlersToNewIdentitiesButtons();
    // If login button to Internet Identity is ever needed uncomment line below
    // await renderAuth();
    const names = await getNames(canisterId);
    render(canisterId, actor, profiling);
    const app = document.getElementById("app");
    const progress = document.getElementById("progress");
    progress!.remove();
    app!.style.display = "block";
  }
}

main().catch((err) => {
  const div = document.createElement("div");
  div.innerText = "An error happened in Candid canister:";
  const pre = document.createElement("pre");
  pre.innerHTML = err.stack;
  div.appendChild(pre);
  const progress = document.getElementById("progress");
  progress!.remove();
  document.body.appendChild(div);
  throw err;
});

// Reload when going back after uploading custom Candid data
window.addEventListener("popstate", (event) => {
  if (event.state) {
    window.location.reload();
  }
});

async function populateIdentities(canisterId: Principal): Promise<Secp256k1KeyIdentity> {
  let identitiesEl = document.getElementById("identities");
  identitiesEl?.addEventListener("change", async function() {
    let value = (identitiesEl as HTMLInputElement).value;
    if(value !== undefined) {
      let identity = identities.filter(i => i.getPrincipal().toString() == value)[0];
      if (identity !== undefined) {
        selectedIdentity = identity;
        actor = await fetchActor(canisterId, selectedIdentity);
      }
    }
  });
  for (let i = 0; i < DEFAULT_IDENTITY_ACCOUNTS_NUMBER; i++) {
    const identity = Secp256k1KeyIdentity.fromSeedPhraseWithDerivationPath(DEFAULT_SEED_PHRASE, DERIVATION_PATH + identities.length);
    identities.push(identity);
    identitiesEl?.appendChild(new Option(identity.getPrincipal().toString(), identity.getPrincipal().toString()));
  }
  return identities[0];
}

export async function refresh_actor(canisterId: Principal) {
  actor = await fetchActor(canisterId, selectedIdentity);
};