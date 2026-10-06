const DAY = 24 * 60 * 60 * 1000;

// "Expires in N days" with N = whole days left, rounded up.
// Less than 24 hours left: "Expires today".
export const expiryText = (expiresAt: string, now: Date): string => {
  const msLeft = Date.parse(expiresAt) - now.getTime();

  if (msLeft < DAY) {
    return "Expires today";
  }

  const daysLeft = Math.ceil(msLeft / DAY);

  return daysLeft === 1 ? "Expires in 1 day" : `Expires in ${daysLeft} days`;
};
