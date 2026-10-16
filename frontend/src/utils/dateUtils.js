export function getDeadlineInfo(deadlineStr) {
  if (!deadlineStr) {
    return {
      label: 'No deadline',
      fullText: 'No deadline set',
      colorClass: 'badge-deadline-safe',
      daysLeft: null,
      status: 'safe',
      borderColor: '#cbd5e1'
    };
  }

  const deadline = new Date(deadlineStr);
  const now = new Date();
  
  // Strip time for accurate day comparison
  const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = deadlineDay - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: `Overdue by ${overdueDays}d`,
      fullText: `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`,
      colorClass: 'badge-deadline-danger',
      daysLeft: diffDays,
      status: 'overdue',
      borderColor: '#fca5a5'
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Due Today',
      fullText: 'Deadline is today',
      colorClass: 'badge-deadline-danger',
      daysLeft: 0,
      status: 'today',
      borderColor: '#fca5a5'
    };
  }

  if (diffDays <= 3) {
    return {
      label: `${diffDays}d left (Urgent)`,
      fullText: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`,
      colorClass: 'badge-deadline-warning',
      daysLeft: diffDays,
      status: 'urgent',
      borderColor: '#fcd34d'
    };
  }

  return {
    label: `${diffDays}d left`,
    fullText: `${diffDays} days remaining`,
    colorClass: 'badge-deadline-safe',
    daysLeft: diffDays,
    status: 'safe',
    borderColor: '#86efac'
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
