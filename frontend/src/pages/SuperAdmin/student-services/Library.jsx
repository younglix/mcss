import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Drawer from '../../../components/ui/Drawer.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import DashboardPageShell from '../dashboard/DashboardPageShell.jsx';
import { useDashboardData } from '../dashboard/useDashboardData.js';
import { EmptyState } from '../dashboard/dashboardHelpers.jsx';
import { api, ApiError } from '../../../lib/api.js';

const ENDPOINTS = { books: '/student-services/library/books', loans: '/student-services/library/loans?outstanding=true', users: '/users/' };

const BOOK_FIELDS = [
  { key: 'title', id: 'book_title', label: 'Title', type: 'text', required: true },
  { key: 'author', id: 'book_author', label: 'Author', type: 'text' },
  { key: 'isbn', id: 'book_isbn', label: 'ISBN', type: 'text' },
  { key: 'category', id: 'book_category', label: 'Category', type: 'text' },
  { key: 'total_copies', id: 'book_total_copies', label: 'Total Copies', type: 'number', required: true },
];

export default function SuperAdminLibrary() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const books = data?.books || [];
  const loans = data?.loans || [];
  const users = data?.users || [];

  const [bookDrawer, setBookDrawer] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookValues, setBookValues] = useState({ title: '', author: '', isbn: '', category: '', total_copies: 1 });
  const [bookErrors, setBookErrors] = useState({});
  const [savingBook, setSavingBook] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutValues, setCheckoutValues] = useState({ book: '', borrower: '', due_date: '' });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkingOut, setCheckingOut] = useState(false);

  const openCreateBook = () => {
    setEditingBook(null);
    setBookValues({ title: '', author: '', isbn: '', category: '', total_copies: 1 });
    setBookErrors({});
    setBookDrawer(true);
  };

  const openEditBook = (book) => {
    setEditingBook(book);
    setBookValues({ title: book.title, author: book.author, isbn: book.isbn, category: book.category, total_copies: book.total_copies });
    setBookErrors({});
    setBookDrawer(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setSavingBook(true);
    setBookErrors({});
    try {
      if (editingBook) {
        await api.patch(`/student-services/library/books/${editingBook.id}`, bookValues);
      } else {
        await api.post('/student-services/library/books', bookValues);
      }
      setBookDrawer(false);
      reload();
    } catch (err) {
      setBookErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async () => {
    setDeleting(true);
    try {
      await api.delete(`/student-services/library/books/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckingOut(true);
    setCheckoutErrors({});
    try {
      await api.post('/student-services/library/loans', checkoutValues);
      setCheckoutOpen(false);
      setCheckoutValues({ book: '', borrower: '', due_date: '' });
      reload();
    } catch (err) {
      setCheckoutErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleReturn = async (loanId) => {
    await api.post(`/student-services/library/loans/${loanId}/return`, {});
    reload();
  };

  return (
    <DashboardPageShell pageTitle="Library" title="Library" subtitle="Book catalog and loans." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div className="space-y-lg">
          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Catalog</h2>
            <Button variant="primary" iconLeft="add" onClick={openCreateBook}>New Book</Button>
          </div>
          <Card padding={books.length ? 'none' : 'lg'}>
            {books.length === 0 ? (
              <EmptyState icon="menu_book" text="No data available yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Title</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Author</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Available</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {books.map((book) => (
                      <tr key={book.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{book.title}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{book.author || '—'}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{book.available_copies} / {book.total_copies}</td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => openEditBook(book)} className="p-2 text-outline hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(book)} className="p-2 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Outstanding Loans</h2>
            <Button variant="secondary" iconLeft="assignment_turned_in" onClick={() => setCheckoutOpen(true)}>Check Out</Button>
          </div>
          <Card padding={loans.length ? 'none' : 'lg'}>
            {loans.length === 0 ? (
              <EmptyState icon="assignment_turned_in" text="No data available yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Book</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Borrower</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider">Due Date</th>
                      <th className="px-lg py-3 font-label-md text-label-md uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-4 font-body-md text-body-md font-semibold text-on-surface">{loan.book_title}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{loan.borrower_name}</td>
                        <td className="px-lg py-4 font-label-sm text-label-sm text-on-surface-variant">{loan.due_date}</td>
                        <td className="px-lg py-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => handleReturn(loan.id)} className="font-label-sm text-label-sm text-primary hover:underline">
                            Mark Returned
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Drawer open={bookDrawer} onClose={() => setBookDrawer(false)} title={editingBook ? 'Edit Book' : 'New Book'}>
        <form onSubmit={handleSaveBook} className="space-y-lg">
          {bookErrors.__all__ && <p className="font-label-md text-label-md text-error">{bookErrors.__all__}</p>}
          {BOOK_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={bookValues[field.key]}
              onChange={(v) => setBookValues((prev) => ({ ...prev, [field.key]: v }))}
              error={bookErrors[field.key]?.[0]}
            />
          ))}
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setBookDrawer(false)} disabled={savingBook}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingBook}>{savingBook ? 'Saving…' : editingBook ? 'Save Changes' : 'Create Book'}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Check Out Book">
        <form onSubmit={handleCheckout} className="space-y-lg">
          {checkoutErrors.__all__ && <p className="font-label-md text-label-md text-error">{checkoutErrors.__all__}</p>}
          <FormField
            field={{ key: 'book', id: 'checkout_book', label: 'Book', type: 'select', required: true, options: books.filter((b) => b.available_copies > 0).map((b) => ({ value: b.id, label: `${b.title} (${b.available_copies} available)` })) }}
            value={checkoutValues.book}
            onChange={(v) => setCheckoutValues((prev) => ({ ...prev, book: v }))}
            error={checkoutErrors.book?.[0]}
          />
          <FormField
            field={{ key: 'borrower', id: 'checkout_borrower', label: 'Borrower', type: 'select', required: true, options: users.map((u) => ({ value: u.id, label: `${u.full_name} (${u.user_type})` })) }}
            value={checkoutValues.borrower}
            onChange={(v) => setCheckoutValues((prev) => ({ ...prev, borrower: v }))}
            error={checkoutErrors.borrower?.[0]}
          />
          <FormField
            field={{ key: 'due_date', id: 'checkout_due_date', label: 'Due Date', type: 'date', required: true }}
            value={checkoutValues.due_date}
            onChange={(v) => setCheckoutValues((prev) => ({ ...prev, due_date: v }))}
            error={checkoutErrors.due_date?.[0]}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setCheckoutOpen(false)} disabled={checkingOut}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={checkingOut}>{checkingOut ? 'Saving…' : 'Check Out'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Book?"
        message={`This can't be undone. Delete "${deleteTarget?.title}"?`}
        loading={deleting}
        onConfirm={handleDeleteBook}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
