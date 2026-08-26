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

const ENDPOINTS = { blocks: '/student-services/hostel/blocks', allocations: '/student-services/hostel/allocations?active=true', students: '/academics/students' };

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'mixed', label: 'Mixed' },
];

function RoomCard({ room, allocations, students, reload }) {
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const occupants = allocations.filter((a) => a.room === room.id);
  const allocatedStudentIds = new Set(allocations.map((a) => a.student));

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/student-services/hostel/allocations', { student: studentId, room: room.id });
      setAllocateOpen(false);
      setStudentId('');
      reload();
    } catch (err) {
      setError(err.message || 'Could not allocate.');
    } finally {
      setSaving(false);
    }
  };

  const handleVacate = async (allocationId) => {
    await api.post(`/student-services/hostel/allocations/${allocationId}/vacate`, {});
    reload();
  };

  return (
    <div className="p-md rounded-lg border border-outline/10">
      <div className="flex items-center justify-between mb-xs">
        <span className="font-label-md text-label-md font-bold text-on-surface">{room.room_number}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{room.occupancy}/{room.capacity}</span>
      </div>
      <div className="flex flex-wrap gap-xs mb-sm">
        {occupants.length === 0 ? (
          <span className="font-label-sm text-label-sm text-outline">Vacant</span>
        ) : (
          occupants.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 font-label-sm text-label-sm px-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              {a.student_name}
              <button type="button" onClick={() => handleVacate(a.id)} className="hover:text-error" title="Vacate">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))
        )}
      </div>
      {room.occupancy < room.capacity && (
        <button type="button" onClick={() => setAllocateOpen(true)} className="font-label-sm text-label-sm text-primary hover:underline">
          + Allocate Student
        </button>
      )}

      <Drawer open={allocateOpen} onClose={() => setAllocateOpen(false)} title={`Allocate — ${room.room_number}`}>
        <form onSubmit={handleAllocate} className="space-y-lg">
          {error && <p className="font-label-md text-label-md text-error">{error}</p>}
          <FormField
            field={{
              key: 'student', id: `allocate_student_${room.id}`, label: 'Student', type: 'select', required: true,
              options: students.filter((s) => !allocatedStudentIds.has(s.id)).map((s) => ({ value: s.id, label: s.full_name })),
            }}
            value={studentId}
            onChange={setStudentId}
          />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setAllocateOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || !studentId}>{saving ? 'Saving…' : 'Allocate'}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function SuperAdminHostel() {
  const endpoints = useMemo(() => ENDPOINTS, []);
  const { data, loading, error, reload } = useDashboardData(endpoints);
  const blocks = data?.blocks || [];
  const allocations = data?.allocations || [];
  const students = data?.students || [];

  const [blockDrawer, setBlockDrawer] = useState(false);
  const [blockValues, setBlockValues] = useState({ name: '', gender: 'mixed' });
  const [blockErrors, setBlockErrors] = useState({});
  const [savingBlock, setSavingBlock] = useState(false);

  const [roomDrawer, setRoomDrawer] = useState(null); // blockId or null
  const [roomValues, setRoomValues] = useState({ room_number: '', capacity: 4 });
  const [roomErrors, setRoomErrors] = useState({});
  const [savingRoom, setSavingRoom] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'block', id }
  const [deleting, setDeleting] = useState(false);

  const roomsByBlock = useMemo(() => {
    const map = {};
    for (const block of blocks) map[block.id] = block.rooms || [];
    return map;
  }, [blocks]);

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setSavingBlock(true);
    setBlockErrors({});
    try {
      await api.post('/student-services/hostel/blocks', blockValues);
      setBlockDrawer(false);
      setBlockValues({ name: '', gender: 'mixed' });
      reload();
    } catch (err) {
      setBlockErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingBlock(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);
    setRoomErrors({});
    try {
      await api.post(`/student-services/hostel/blocks/${roomDrawer}/rooms`, roomValues);
      setRoomDrawer(null);
      setRoomValues({ room_number: '', capacity: 4 });
      reload();
    } catch (err) {
      setRoomErrors(err instanceof ApiError && err.errors ? err.errors : { __all__: err.message });
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteBlock = async () => {
    setDeleting(true);
    try {
      await api.delete(`/student-services/hostel/blocks/${deleteTarget.id}`);
      setDeleteTarget(null);
      reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardPageShell pageTitle="Hostel" title="Hostel" subtitle="Blocks, rooms, and student allocations." loading={loading} error={error} onReload={reload} skeletonCount={1}>
      {data && (
        <div>
          <div className="flex justify-end mb-md">
            <Button variant="primary" iconLeft="add" onClick={() => setBlockDrawer(true)}>New Block</Button>
          </div>

          {blocks.length === 0 ? (
            <Card padding="lg"><EmptyState icon="holiday_village" text="No data available yet" /></Card>
          ) : (
            <div className="space-y-lg">
              {blocks.map((block) => (
                <Card key={block.id} padding="lg">
                  <div className="flex items-center justify-between flex-wrap gap-sm mb-md">
                    <div className="flex items-center gap-sm">
                      <h3 className="font-headline-md text-headline-sm text-on-surface">{block.name}</h3>
                      <Badge tone="secondary">{block.gender}</Badge>
                    </div>
                    <div className="flex items-center gap-sm">
                      <button type="button" onClick={() => setRoomDrawer(block.id)} className="font-label-sm text-label-sm text-primary hover:underline">+ Add Room</button>
                      <button type="button" onClick={() => setDeleteTarget({ type: 'block', id: block.id })} className="p-1 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {(roomsByBlock[block.id] || []).length === 0 ? (
                    <p className="font-label-sm text-label-sm text-on-surface-variant">No rooms yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                      {(roomsByBlock[block.id] || []).map((room) => (
                        <RoomCard key={room.id} room={room} allocations={allocations} students={students} reload={reload} />
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={blockDrawer} onClose={() => setBlockDrawer(false)} title="New Hostel Block">
        <form onSubmit={handleCreateBlock} className="space-y-lg">
          {blockErrors.__all__ && <p className="font-label-md text-label-md text-error">{blockErrors.__all__}</p>}
          <FormField field={{ key: 'name', id: 'block_name', label: 'Block Name', type: 'text', required: true }} value={blockValues.name} onChange={(v) => setBlockValues((p) => ({ ...p, name: v }))} error={blockErrors.name?.[0]} />
          <FormField field={{ key: 'gender', id: 'block_gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS }} value={blockValues.gender} onChange={(v) => setBlockValues((p) => ({ ...p, gender: v }))} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setBlockDrawer(false)} disabled={savingBlock}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingBlock}>{savingBlock ? 'Saving…' : 'Create Block'}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={!!roomDrawer} onClose={() => setRoomDrawer(null)} title="New Room">
        <form onSubmit={handleCreateRoom} className="space-y-lg">
          {roomErrors.__all__ && <p className="font-label-md text-label-md text-error">{roomErrors.__all__}</p>}
          <FormField field={{ key: 'room_number', id: 'room_number', label: 'Room Number', type: 'text', required: true }} value={roomValues.room_number} onChange={(v) => setRoomValues((p) => ({ ...p, room_number: v }))} error={roomErrors.room_number?.[0]} />
          <FormField field={{ key: 'capacity', id: 'room_capacity', label: 'Capacity', type: 'number', required: true }} value={roomValues.capacity} onChange={(v) => setRoomValues((p) => ({ ...p, capacity: v }))} error={roomErrors.capacity?.[0]} />
          <div className="flex justify-end gap-sm pt-md border-t border-outline/10">
            <Button type="button" variant="ghost" onClick={() => setRoomDrawer(null)} disabled={savingRoom}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingRoom}>{savingRoom ? 'Saving…' : 'Create Room'}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Block?"
        message="This can't be undone. All rooms in this block will also be removed."
        loading={deleting}
        onConfirm={handleDeleteBlock}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
