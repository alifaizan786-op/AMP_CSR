// Formats cents as dollars for activity messages, e.g. 2999 -> "$29.99"
const formatMoney = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export default formatMoney;
