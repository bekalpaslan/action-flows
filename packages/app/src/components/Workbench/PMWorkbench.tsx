/**
 * PMWorkbench Component
 * Project Management workbench for tasks and documentation
 *
 * Features:
 * - Task list with status (todo, in-progress, done)
 * - Project documentation links
 * - Task creation form
 * - Task filtering by status
 * - Project milestones/timeline display
 *
 * Layout:
 * - Header bar with task count and controls
 * - Filter bar for task status filtering
 * - Main content area split: Task list (left), Documentation panel (right)
 * - Optional: Milestone timeline at bottom
 */

import React, { useState, useCallback, useMemo } from 'react';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { OrchestratorButton } from '../OrchestratorButton';
import './PMWorkbench.css';

/**
 * Task status type
 */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/**
 * Task priority type
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task interface for PM workbench
 */
export interface PMTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  tags?: string[];
}

/**
 * Documentation link interface
 */
export interface DocLink {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
}

/**
 * Milestone interface for timeline
 */
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'upcoming' | 'current' | 'completed';
  progress?: number; // 0-100
}

/**
 * PMWorkbench component props
 */
export interface PMWorkbenchProps {
  /** Tasks to display */
  tasks?: PMTask[];

  /** Documentation links */
  docs?: DocLink[];

  /** Project milestones */
  milestones?: Milestone[];

  /** Callback when a task is created */
  onTaskCreate?: (task: Omit<PMTask, 'id' | 'createdAt'>) => void;

  /** Callback when a task status is changed */
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;

  /** Callback when a task is deleted */
  onTaskDelete?: (taskId: string) => void;

  /** Callback when a doc link is clicked */
  onDocClick?: (docId: string) => void;
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'status-badge--todo';
    case 'in-progress':
      return 'status-badge--in-progress';
    case 'done':
      return 'status-badge--done';
    default:
      return '';
  }
}

/**
 * Get priority badge class
 */
function getPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'priority-badge--low';
    case 'medium':
      return 'priority-badge--medium';
    case 'high':
      return 'priority-badge--high';
    case 'critical':
      return 'priority-badge--critical';
    default:
      return '';
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * PMWorkbench - Project Management Dashboard
 */
export function PMWorkbench({
  tasks = [],
  docs = [],
  milestones = [],
  onTaskCreate,
  onTaskStatusChange,
  onTaskDelete,
  onDocClick,
}: PMWorkbenchProps): React.ReactElement {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'PMWorkbench',
    getContext: () => ({
      projectStats: { total: tasks.length, completed: taskCounts.done },
      milestones: milestones.length,
    }),
  });

  // Filter tasks based on status
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  // Task counts by status
  const taskCounts = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      total: tasks.length,
    };
  }, [tasks]);

  // Handle task creation
  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;

    onTaskCreate?.({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: 'todo',
      priority: newTaskPriority,
    });

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowCreateForm(false);
  }, [newTaskTitle, newTaskDescription, newTaskPriority, onTaskCreate]);

  // Handle status change
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      onTaskStatusChange?.(taskId, newStatus);
    },
    [onTaskStatusChange]
  );

  // Group docs by category
  const docsByCategory = useMemo(() => {
    const grouped: Record<string, DocLink[]> = {};
    docs.forEach((doc) => {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc);
    });
    return grouped;
  }, [docs]);

  return (
    <div className="pm-workbench">
      {/* Header Bar */}
      <div className="pm-workbench__header">
        <div className="pm-workbench__header-left">
          <h1 className="pm-workbench__title">Project Management</h1>
          <div className="pm-workbench__task-count">
            <span className="task-count-badge">
              {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
        <div className="pm-workbench__header-right">
          <DiscussButton componentName="PMWorkbench" onClick={openDialog} size="small" />
          <OrchestratorButton source="pm-plan" context={{ action: 'plan-review' }}>
            <button className="pm-workbench__action-btn">Plan with Orchestrator</button>
          </OrchestratorButton>
          <button
            className="pm-workbench__create-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {/* Task Creation Form */}
      {showCreateForm && (
        <div className="pm-workbench__create-form">
          <div className="create-form__row">
            <input
              type="text"
              className="create-form__input create-form__input--title"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateTask();
                }
              }}
            />
            <select
              className="create-form__select"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="create-form__submit" onClick={handleCreateTask}>
              Create
            </button>
          </div>
          <textarea
            className="create-form__input create-form__input--description"
            placeholder="Task description (optional)..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="pm-workbench__filter-bar">
        <div className="filter-bar__tabs">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'filter-tab--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({taskCounts.total})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'todo' ? 'filter-tab--active' : ''}`}
            onClick={() => setStatusFilter('todo')}
          >
            To Do ({taskCounts.todo})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'in-progress' ? 'filter-tab--active' : ''}`}
            onClick={() => setStatusFilter('in-progress')}
          >
            In Progress ({taskCounts.inProgress})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'done' ? 'filter-tab--active' : ''}`}
            onClick={() => setStatusFilter('done')}
          >
            Done ({taskCounts.done})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pm-workbench__content">
        {/* Task List Panel */}
        <div className="pm-workbench__task-panel">
          <div className="task-panel__header">
            <h2 className="task-panel__title">Tasks</h2>
          </div>
          <div className="task-panel__list">
            {filteredTasks.length === 0 ? (
              <div className="task-panel__empty">
                <div className="empty-icon">📋</div>
                <p>
                  {statusFilter === 'all'
                    ? 'No tasks yet. Create one to get started!'
                    : `No ${statusFilter} tasks.`}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-card__header">
                    <div className="task-card__title-row">
                      <span className="task-card__title">{task.title}</span>
                      <div className="task-card__badges">
                        <span
                          className={`status-badge ${getStatusBadgeClass(task.status)}`}
                        >
                          {task.status === 'in-progress' ? 'In Progress' : task.status}
                        </span>
                        <span
                          className={`priority-badge ${getPriorityBadgeClass(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="task-card__description">{task.description}</p>
                    )}
                  </div>
                  <div className="task-card__footer">
                    <div className="task-card__meta">
                      {task.assignee && (
                        <span className="task-card__assignee">{task.assignee}</span>
                      )}
                      {task.dueDate && (
                        <span className="task-card__due-date">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="task-card__tags">
                          {task.tags.map((tag) => (
                            <span key={tag} className="task-card__tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="task-card__actions">
                      <select
                        className="task-card__status-select"
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as TaskStatus)
                        }
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      {onTaskDelete && (
                        <button
                          className="task-card__delete-btn"
                          onClick={() => onTaskDelete(task.id)}
                          title="Delete task"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Documentation Panel */}
        <div className="pm-workbench__docs-panel">
          <div className="docs-panel__header">
            <h2 className="docs-panel__title">Documentation</h2>
          </div>
          <div className="docs-panel__content">
            {docs.length === 0 ? (
              <div className="docs-panel__empty">
                <div className="empty-icon">📚</div>
                <p>No documentation links available.</p>
              </div>
            ) : (
              Object.entries(docsByCategory).map(([category, categoryDocs]) => (
                <div key={category} className="docs-category">
                  <h3 className="docs-category__title">{category}</h3>
                  <ul className="docs-category__list">
                    {categoryDocs.map((doc) => (
                      <li key={doc.id} className="doc-link">
                        <a
                          href={doc.url}
                          className="doc-link__anchor"
                          onClick={(e) => {
                            if (onDocClick) {
                              e.preventDefault();
                              onDocClick(doc.id);
                            }
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="doc-link__title">{doc.title}</span>
                          {doc.description && (
                            <span className="doc-link__description">
                              {doc.description}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Milestone Timeline (if milestones exist) */}
      {milestones.length > 0 && (
        <div className="pm-workbench__timeline">
          <div className="timeline__header">
            <h2 className="timeline__title">Milestones</h2>
          </div>
          <div className="timeline__content">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`milestone-item milestone-item--${milestone.status}`}
              >
                <div className="milestone-item__marker">
                  <div className="milestone-item__dot" />
                  {index < milestones.length - 1 && (
                    <div className="milestone-item__line" />
                  )}
                </div>
                <div className="milestone-item__content">
                  <div className="milestone-item__header">
                    <span className="milestone-item__title">{milestone.title}</span>
                    <span className="milestone-item__date">
                      {formatDate(milestone.dueDate)}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="milestone-item__description">
                      {milestone.description}
                    </p>
                  )}
                  {typeof milestone.progress === 'number' && (
                    <div className="milestone-item__progress">
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      <span className="progress-bar__label">{milestone.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="PMWorkbench"
        componentContext={{
          projectStats: { total: tasks.length, completed: taskCounts.done },
          milestones: milestones.length,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
