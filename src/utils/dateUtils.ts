export type DeadlineStatus = 'Open' | 'Closing soon' | 'Expired' | 'Date unknown';

export interface DeadlineAnalysis {
  status: DeadlineStatus;
  daysRemaining: number | null;
  formattedDate: string;
  isExpired: boolean;
}

/**
 * Parses and computes the freshness and deadline status of an opportunity.
 */
export function getDeadlineStatus(deadlineStr: string | undefined | null): DeadlineAnalysis {
  if (!deadlineStr || typeof deadlineStr !== 'string' || !deadlineStr.trim()) {
    return {
      status: 'Date unknown',
      daysRemaining: null,
      formattedDate: 'Flexible / Unspecified',
      isExpired: false
    };
  }

  const cleanStr = deadlineStr.trim();

  // Try parsing YYYY-MM-DD or standard Date strings
  let dateObj: Date | null = null;
  const isoMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    const parsedTimestamp = Date.parse(cleanStr);
    if (!isNaN(parsedTimestamp)) {
      dateObj = new Date(parsedTimestamp);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return {
      status: 'Date unknown',
      daysRemaining: null,
      formattedDate: cleanStr,
      isExpired: false
    };
  }

  // Calculate midnight-to-midnight day difference
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineMidnight = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  const diffMs = deadlineMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (diffDays < 0) {
    return {
      status: 'Expired',
      daysRemaining: diffDays,
      formattedDate,
      isExpired: true
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'Closing soon',
      daysRemaining: diffDays,
      formattedDate,
      isExpired: false
    };
  }

  return {
    status: 'Open',
    daysRemaining: diffDays,
    formattedDate,
    isExpired: false
  };
}
