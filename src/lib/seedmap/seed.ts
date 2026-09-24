/**
 * World seeds like the game reads them: a number is used as it is, any other text is hashed with
 * Java's String.hashCode. The engine wants the seed as an unsigned 64 bit integer in decimal.
 */

/** decimal string of the seed as the engine wants it */
export function parseSeed(input: string): string {
	const text = input.trim();
	if (/^-?\d+$/.test(text)) return BigInt.asUintN(64, BigInt(text)).toString();

	let hash = 0;
	for (const char of text) hash = (Math.imul(31, hash) + char.charCodeAt(0)) | 0;
	return BigInt.asUintN(64, BigInt(hash)).toString();
}

/** the seed as a signed number, the way it is shown in game (F3 and /seed) */
export function displaySeed(input: string) {
	return BigInt.asIntN(64, BigInt(parseSeed(input))).toString();
}

export function randomSeed() {
	const bytes = crypto.getRandomValues(new BigUint64Array(1));
	return BigInt.asIntN(64, bytes[0]).toString();
}
