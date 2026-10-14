// Escapes characters that have special meaning in a regex, so user input is matched literally
const escapeRegex = (text: string): string =>
	text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;
