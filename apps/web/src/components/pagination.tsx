interface PaginationProps {
  prefix: string;
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ prefix, page, limit, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav className="pagination" aria-label="Pagination" data-testid={`${prefix}-pagination`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        data-testid={`${prefix}-page-prev`}
      >
        Previous
      </button>
      <span data-testid={`${prefix}-page-info`}>
        Page {page} of {pages} ({total} total)
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        data-testid={`${prefix}-page-next`}
      >
        Next
      </button>
    </nav>
  );
}
