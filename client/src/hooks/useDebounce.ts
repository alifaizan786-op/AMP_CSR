import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delay` ms,
// so search fires once when the CSR pauses instead of on every keystroke
const useDebounce = <T>(value: T, delay = 300): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		// A new keystroke before the delay ends cancels the pending update
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};

export default useDebounce;
