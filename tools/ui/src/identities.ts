import { identities, DEFAULT_SEED_PHRASE, DERIVATION_PATH } from './index';
import { Secp256k1KeyIdentity } from './identity-secp256k1/secp256k1';
import { decodePem } from './identity-secp256k1/keyDecoder'

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
		console.log(keyInput);
		let value = (keyInput as HTMLInputElement).value;
		if (value) {
			addFromPrivateKey(value);
		}
	});
}

function addNewIdentity() {
	let identitiesEl = document.getElementById("identities");
	const identity = Secp256k1KeyIdentity.fromSeedPhraseWithDerivationPath(DEFAULT_SEED_PHRASE, DERIVATION_PATH + identities.length);
	identities.push(identity);
	identitiesEl?.appendChild(new Option(identity.getPrincipal().toString(), identity.getPrincipal().toString()));
}
  
function addFromSeedPhrase(seedPhrase: string | string[]) {
	let identitiesEl = document.getElementById("identities");
	const identity = Secp256k1KeyIdentity.fromSeedPhrase(seedPhrase);
	identities.push(identity);
	identitiesEl?.appendChild(new Option(identity.getPrincipal().toString(), identity.getPrincipal().toString()));
}
  
function addFromPrivateKey(privateKey: string) {
	let privateKeyParsed = decodePem(privateKey).replace(/\n/g, "").replace(/\r/g, "");
	let identitiesEl = document.getElementById("identities");
	const identity = Secp256k1KeyIdentity.fromSecretKey(
		Buffer.from(privateKeyParsed, "base64"),
	);
	identities.push(identity);
	identitiesEl?.appendChild(new Option(identity.getPrincipal().toString(), identity.getPrincipal().toString()));
}