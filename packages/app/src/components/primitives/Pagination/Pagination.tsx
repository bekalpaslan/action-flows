import React from 'react';
import './Pagination.css';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ELLIPSIS = '...';

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | typeof ELLIPSIS)[] {
  const totalNumbers = siblingCount * 2 + 3; // siblings on each side + current + first + last
  const totalBlocks = totalNumbers + 2; // + 2 ellipsis

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, ELLIPSIS, totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, ELLIPSIS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, totalPages];
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showFirstLast = false,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const pages = generatePageNumbers(currentPage, totalPages, siblingCount);

    const handlePageClick = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    };

    const baseClassName = 'afw-pagination';
    const sizeClassName = `afw-pagination--${size}`;
    const combinedClassName = [baseClassName, sizeClassName, className]
      .filter(Boolean)
      .join(' ');

    return (
      <nav
        ref={ref}
        className={combinedClassName}
        aria-label="Pagination"
        {...props}
      >
        {showFirstLast && (
          <button
            type="button"
            className="afw-pagination__button"
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            «
          </button>
        )}

        <button
          type="button"
          className="afw-pagination__button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ←
        </button>

        {pages.map((page, index) => {
          if (page === ELLIPSIS) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="afw-pagination__ellipsis"
                aria-hidden="true"
              >
                {ELLIPSIS}
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              className={`afw-pagination__button ${
                isActive ? 'afw-pagination__button--active' : ''
              }`}
              onClick={() => handlePageClick(page as number)}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          className="afw-pagination__button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          →
        </button>

        {showFirstLast && (
          <button
            type="button"
            className="afw-pagination__button"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            »
          </button>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';
