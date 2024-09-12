import { execSync } from 'child_process';

export function canisterStatusCheck(path: string): boolean {
	try {
		const command = `dfx canister status --all`;
		execSync(command, { cwd: path });
		return true;
	} catch (err) {
		return false;
	}
}

export function canisterStatusCheckWithCanisterId(path: string, canisterId: string): boolean {
	try {
		const command = `dfx canister status ${canisterId} `;
		execSync(command, { cwd: path });
		return true;
	} catch (err) {
		return false;
	}
}