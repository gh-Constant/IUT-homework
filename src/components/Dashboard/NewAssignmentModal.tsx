import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Subject, Category, TargetType, User } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAssignmentCreated: () => void;
}

export default function NewAssignmentModal({
  isOpen,
  onClose,
  currentUser,
  onAssignmentCreated,
}: NewAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<Subject>('Communication');
  const [dueDate, setDueDate] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('global');
  const [targetGroups, setTargetGroups] = useState<Category[]>([]);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
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
      const { error } = await supabase.from('assignments').insert([{
        title,
        description,
        subject,
        due_date: dueDate,
        created_by: currentUser.id,
        target_type: targetType,
        target_groups: targetGroups,
        target_users: targetUsers,
      }]);

      if (error) throw error;

      toast.success('Devoir créé avec succès');
      onAssignmentCreated();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la création du devoir');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              Nouveau devoir
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Matière
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date limite
              </label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type de cible
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
              >
                <option value="global">Tout le monde</option>
                <option value="personal">Personnel</option>
                <option value="group">Groupes spécifiques</option>
              </select>
            </div>

            {targetType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Groupes cibles
                </label>
                <select
                  multiple
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={targetGroups}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value as Category);
                    setTargetGroups(selected);
                  }}
                >
                  <option value="C2">C2</option>
                  <option value="C1">C1</option>
                  <option value="B2">B2</option>
                  <option value="B1">B1</option>
                  <option value="A2">A2</option>
                  <option value="A1">A1</option>
                </select>
              </div>
            )}

            {targetType === 'personal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Utilisateurs cibles
                </label>
                <select
                  multiple
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={targetUsers}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setTargetUsers(selected);
                  }}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer le devoir
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}