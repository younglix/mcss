import AdminCrudPage from '../administration/AdminCrudPage.jsx';

const DAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => ({
  value: d,
  label: d.charAt(0).toUpperCase() + d.slice(1),
}));

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const COLUMNS = [
  { key: 'day_of_week', label: 'Day', render: (item) => item.day_of_week.charAt(0).toUpperCase() + item.day_of_week.slice(1) },
  { key: 'meal_type', label: 'Meal', render: (item) => item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1) },
  { key: 'description', label: 'Menu' },
];

const FORM_FIELDS = [
  { key: 'day_of_week', label: 'Day', type: 'select', required: true, options: DAY_OPTIONS },
  { key: 'meal_type', label: 'Meal', type: 'select', required: true, options: MEAL_TYPE_OPTIONS },
  { key: 'description', label: 'Menu Description', type: 'textarea', required: true },
];

export default function SuperAdminMess() {
  return (
    <AdminCrudPage
      pageTitle="School Meals / Mess"
      title="School Meals / Mess"
      subtitle="The weekly dining menu."
      endpoint="/student-services/mess/menus"
      itemLabel="Menu Entry"
      columns={COLUMNS}
      formFields={FORM_FIELDS}
      initialFormValues={{ day_of_week: 'monday', meal_type: 'breakfast', description: '' }}
      emptyIcon="restaurant"
    />
  );
}
