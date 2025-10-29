import { useEffect, useState } from 'react';

export function useUrlParams<T extends string>(key: string, defaultValue: T): [T, (value: T) => void] {
  const getInitialValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    const params = new URLSearchParams(window.location.search);
    return (params.get(key) as T) || defaultValue;
  };

  const [value, setValue] = useState<T>(getInitialValue);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [key, value, defaultValue]);

  const updateValue = (newValue: T) => {
    setValue(newValue);
  };

  return [value, updateValue];
}

