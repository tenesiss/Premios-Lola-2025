import './env';

export function getVotingPolicy(userId: string) {
  const entries = (process.env.GROUP_ALLOW_REMOTE ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (entries.some(entry => !/^\d+$/.test(entry) || !Number.isSafeInteger(Number(entry)) || Number(entry) <= 0)) {
    throw new Error('GROUP_ALLOW_REMOTE must be a comma-separated list of positive group IDs.');
  }

  return {
    repeatVoteGroups: [...new Set(entries.map(Number))],
    canRepeatVoteAnyGroup: Boolean(userId && userId === process.env.VOTE_MASTER),
  };
}
