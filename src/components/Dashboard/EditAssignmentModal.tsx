import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Subject, Category, TargetType, User, Assignment } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  assignment: Assignment;
  onAssignmentUpdated: () => void;
}

export default function EditAssignmentModal({
  isOpen,
  onClose,
  currentUser,
  assignment,
  onAssignmentUpdated,
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [subject, setSubject] = useState<Subject>(assignment.subject);
  const [dueDate, setDueDate] = useState(assignment.due_date.split('T')[0]); // Format date for input
  const [targetType, setTargetType] = useState<TargetType>(assignment.target_type);
  const [targetGroups, setTargetGroups] = useState<Category[]>(assignment.target_groups || []);
  const [targetUsers, setTargetUsers] = useState<string[]>(assignment.target_users || []);
  const [users, setUsers] = useState<User[]>([]);

  const subjects: Subject[] = [
    'Communication',
    'SAE',
    'Anglais',
    'Informatique',
    'Management',
    'Marketing',
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username');
      
      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          title,
          description,
          subject,
          due_date: dueDate,
          target_type: targetType,
          target_groups: targetGroups,
          target_users: targetUsers,
        })
        .eq('id', assignment.id);

      if (error) throw error;

      toast.success('Devoir modifié avec succès');
      onAssignmentUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Erreur lors de la modification du devoir');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Modifier le devoir
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <ReactQuill
                value={description}
                onChange={setDescription}
                className="bg-white"
                theme="snow"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Matière
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Type de cible
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="global">Tout le monde</option>
                <option value="group">Groupes spécifiques</option>
                <option value="personal">Utilisateurs spécifiques</option>
              </select>
            </div>

            {targetType === 'group' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Groupes cibles
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => {
                        setTargetGroups(prev => 
                          prev.includes(group as Category)
                            ? prev.filter(g => g !== group)
                            : [...prev, group as Category]
                        )
                      }}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        targetGroups.includes(group as Category)
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {targetType === 'personal' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Utilisateurs cibles
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300">
                  {users.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                        targetUsers.includes(user.id) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={targetUsers.includes(user.id)}
                        onChange={(e) => {
                          setTargetUsers(prev =>
                            e.target.checked
                              ? [...prev, user.id]
                              : prev.filter(id => id !== user.id)
                          )
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2">{user.username}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Modifier le devoir
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 