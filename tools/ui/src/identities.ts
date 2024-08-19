import { identities, DEFAULT_SEED_PHRASE, DERIVATION_PATH } from "./index";
import { Secp256k1KeyIdentity } from "./identity-secp256k1/secp256k1";
import { decodePem } from "./identity-secp256k1/keyDecoder";
import copy from "copy-to-clipboard";

export async function addEventHandlersToNewIdentitiesButtons() {
  let randomIdentity = document.getElementById("add-new-random-identity");
  randomIdentity?.addEventListener("click", () => {
    addNewIdentity();
  });
  let seedIdentity = document.getElementById("add-new-seed-identity");
  seedIdentity?.addEventListener("click", () => {
    let seedInput = document.getElementById("seed-phrase-input");
    let value = (seedInput as HTMLInputElement).value;
    if (value) {
      addFromSeedPhrase(value);
    }
  });
  let keyIdentity = document.getElementById("add-new-key-identity");
  keyIdentity?.addEventListener("click", () => {
    let keyInput = document.getElementById("key-input");
    let value = (keyInput as HTMLInputElement).value;
    if (value) {
      addFromPrivateKey(value);
    }
  });
}

function addNewIdentity() {
  let identitiesEl = document.getElementById(
    "identities"
  ) as HTMLSelectElement | null;
  const identity = Secp256k1KeyIdentity.fromSeedPhraseWithDerivationPath(
    DEFAULT_SEED_PHRASE,
    DERIVATION_PATH + identities.length
  );
  const currentLength = identitiesEl?.length || 0;
  identities.push(identity);
  identitiesEl?.appendChild(
    new Option(
      `${currentLength + 1}. ${shortenAddress(
        identity.getPrincipal().toString()
      )}`,
      identity.getPrincipal().toString()
    )
  );
}

function addFromSeedPhrase(seedPhrase: string | string[]) {
  let identitiesEl = document.getElementById(
    "identities"
  ) as HTMLSelectElement | null;
  const identity = Secp256k1KeyIdentity.fromSeedPhrase(seedPhrase);
  const currentLength = identitiesEl?.length || 0;

  identities.push(identity);
  identitiesEl?.appendChild(
    new Option(
      `${currentLength + 1}. ${shortenAddress(
        identity.getPrincipal().toString()
      )}`,
      identity.getPrincipal().toString()
    )
  );
}

function addFromPrivateKey(privateKey: string) {
  let privateKeyParsed = decodePem(privateKey)
    .replace(/\n/g, "")
    .replace(/\r/g, "");
  let identitiesEl = document.getElementById(
    "identities"
  ) as HTMLSelectElement | null;
  const identity = Secp256k1KeyIdentity.fromSecretKey(
    Buffer.from(privateKeyParsed, "base64")
  );
  const currentLength = identitiesEl?.length || 0;

  identities.push(identity);
  identitiesEl?.appendChild(
    new Option(
      `${currentLength + 1}. ${shortenAddress(
        identity.getPrincipal().toString()
      )}`,
      identity.getPrincipal().toString()
    )
  );
}

export function shortenAddress(address: string) {
  if (address.length < 13) {
    return address;
  }
  return `${address.substring(0, 4)}...${address.substring(
    address.length - 4
  )}`;
}

export function addCopyToClipBoardListener() {
  const copyIcon = document.getElementById("copy-identity");
  copyIcon?.addEventListener("click", () => {
    const identitiesSelect = document.getElementById("identities") as
      | HTMLSelectElement
      | undefined;
    const selectedIdentity = identitiesSelect?.value;
    if (selectedIdentity) {
      copy(selectedIdentity);
    }
  });
}

export function addOpenIdentitiesPopoverListener() {
  const addIdentityBtn = document.getElementById("add-identity");
  addIdentityBtn?.addEventListener("click", () => {
    const popoverWrapper = document.querySelector(".popover__wrapper");
    const popoverContent = document.querySelector(".popover__content");
    popoverWrapper?.classList.add("popover__wrapper-active");
    popoverContent?.classList.add("popover__content-active");
  });
}

export function addCloseIdentitiesPopoverListener() {
  const closeIdentityBtn = document.getElementById("close-identities-form");
  closeIdentityBtn?.addEventListener("click", () => {
    const popoverWrapper = document.querySelector(".popover__wrapper");
    const popoverContent = document.querySelector(".popover__content");
    popoverWrapper?.classList.remove("popover__wrapper-active");
    popoverContent?.classList.remove("popover__content-active");
  });
}
