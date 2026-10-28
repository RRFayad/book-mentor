const DAY = 24 * 60 * 60 * 1000;

// "Expires in N days" with N = whole days left, rounded up.
// Less than 24 hours left: "Expires today".
export const expiryText = (expiresAt: Date, now: Date): string => {
  const msLeft = expiresAt.getTime() - now.getTime();

  if (msLeft < DAY) {
    return "Expires today";
  }

  const daysLeft = Math.ceil(msLeft / DAY);

  return daysLeft === 1 ? "Expires in 1 day" : `Expires in ${daysLeft} days`;
};
