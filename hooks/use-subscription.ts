import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function useSubscription() {
  const { data, error } = useSWR('/api/user/usage', fetcher);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    isPro: data?.isPro === true,
  };
}
