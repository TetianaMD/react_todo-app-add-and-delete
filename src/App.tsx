/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID, createTodos, deleteTodo, getTodos } from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isTitle, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const filteredTodos = todos.filter(todo => {
    switch (filterStatus) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  // Відправляє запит на сервер для отримання списку (todos).
  const handleRequest = async () => {
    try {
      setLoading(true);
      const allTodo = await getTodos();

      setTodos(allTodo);
      setError(null); // При успішному завершенні запиту помилка схована
    } catch (errors) {
      // Обробка помилок, якщо вони виникають під час відправлення запиту
      setError('Unable to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (USER_ID) {
      handleRequest();
    }

    setTimeout(() => {
      setError(''); // Очищаємо помилку після схову повідомлення
    }, 3000);
  }, []);

  const addTodo = ({ title, completed, userId }: Omit<Todo, 'id'>) => {
    createTodos({ title, completed, userId }).then(newTodo => {
      setTodos(currentTodo => [...currentTodo, newTodo]);
    });
  };

  const deleteTodos = async (userId: number) => {
    try {
      setLoading(true);

      await deleteTodo(userId);
      setTodos(currentTodo => currentTodo.filter(todo => todo.id !== userId));
    } catch (errors) {
      setError('Unable to delete a todo');
    } finally {
      setLoading(false);
    }
  };

  // Відповідає за обробку події форми.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isTitle.trim() === '') {
      setError('Title should not be empty');

      return;
    }

    try {
      setLoading(true);

      // create a todo with id: 0
      setTempTodo({
        id: 0,
        title: isTitle.trim(),
        completed: false,
        userId: USER_ID,
      });
      // викликаємо функцію addTodo, яка відправляє запит на сервер для створення нового todo
      const newTodo = await addTodo({
        title: isTitle.trim(),
        completed: false,
        userId: USER_ID,
      });

      setTodos(prevTodos => [...prevTodos, newTodo] as Todo[]); // додаємо нове todo до масиву todos
      setTempTodo(null); // Сховати tempTodo
      setTitle('');
      handleRequest(); // Оновлюємо список завдань після додавання нового завдання
    } catch (errors) {
      setError('Unable to add a todo');
    } finally {
      setLoading(false);
    }
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleInputTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const allTodosCompleted = todos.every(todo => todo.completed);

  // видаляє всі завершені todo
  const clearCompletedTodos = async () => {
    try {
      setLoading(true);
      // Відбір завершених todo
      const completedTodosIds = todos
        .filter(todo => todo.completed)
        .map(todo => todo.id);

      // Видалення кожної завершеної todo за її ідентифікатором
      await Promise.all(completedTodosIds.map(id => deleteTodo(id)));
      // Оновлення списку todos, виключаючи завершені todo
      setTodos(currentTodos => currentTodos.filter(todo => !todo.completed));

      // Перевірка, чи залишилися невиконані todo
      if (todos.some(todo => !todo.completed)) {
        setFilterStatus('completed'); // встановлюємо статус фільтра на 'Completed'todo
      }
    } finally {
      setLoading(false);
    }
  };

  // Обчислює кількість невиконаних todo
  const todosCounter = todos.filter(todo => !todo.completed).length;

  const toggleTodoCompletion = (todoId: number) => {
    try {
      // Отримуємо посилання на завдання за його id
      const updatedTodos = todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      );

      // Оновлюємо стан todos
      setTodos(updatedTodos);

      // Отримуємо новий стан фільтра
      let newFilterStatus = 'all';

      if (filterStatus === 'completed') {
        newFilterStatus = 'active';
      } else if (filterStatus === 'active') {
        newFilterStatus = 'all';
      }

      // Оновлюємо стан фільтра
      setFilterStatus(newFilterStatus);
    } catch (errors) {
      setError('Unable to toggle todo completion');
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length > 0 && (
            <button
              type="button"
              className={`todoapp__toggle-all ${allTodosCompleted ? 'active' : ''}`}
              data-cy="ToggleAllButton"
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              value={isTitle}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={e => {
                handleInputTodo(e);
              }}
              disabled={loading}
              autoFocus
            />
          </form>
        </header>

        {!loading && (
          <section className="todoapp__main" data-cy="TodoList">
            {/* This is a completed todo */}
            {filteredTodos.map(todo => (
              <div
                key={todo.id}
                data-cy="Todo"
                className={`todo ${todo.completed ? 'completed' : ''}`}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={todo.completed}
                    onClick={() => toggleTodoCompletion(todo.id)}
                  />
                </label>
                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>

                {/* Remove button appears only on hover */}
                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                  onClick={() => {
                    if (deleteTodos) {
                      deleteTodos(todo.id);
                    }
                  }}
                >
                  ×
                </button>

                {/* overlay will cover the todo while it is being deleted or updated */}
                <div
                  data-cy="TodoLoader"
                  className={`modal overlay ${loading ? '' : 'hidden'}`}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${todosCounter} ${todosCounter === 1 ? 'item' : 'items'} left`}
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filterStatus === 'all' ? 'selected' : ''}`} // use the selected class to highlight a selected link;
                data-cy="FilterLinkAll"
                onClick={() => setFilterStatus('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${filterStatus === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setFilterStatus('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${filterStatus === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!todos.some(todo => todo.completed)}
              onClick={clearCompletedTodos}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${!loading && error ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError(null)}
        />
        {/* show only one message at a time */}
        {/* Unable to load todos
          <br />
          Title should not be empty
          <br />
          Unable to add a todo
          <br />
          Unable to delete a todo
          <br />
          Unable to update a todo */}
        {error}
      </div>
    </div>
  );
};

// {/* This todo is an active todo */ }
// <div data-cy="Todo" className="todo">
//   <label className="todo__status-label">
//     <input
//       data-cy="TodoStatus"
//       type="checkbox"
//       className="todo__status"
//     />
//   </label>

//   <span data-cy="TodoTitle" className="todo__title">
//     Not Completed Todo
//   </span>
//   <button
//     type="button"
//     className="todo__remove"
//     data-cy="TodoDelete"
//   >
//     ×
//   </button>

//   <div data-cy="TodoLoader" className="modal overlay">
//     <div className="modal-background has-background-white-ter" />
//     <div className="loader" />
//   </div>
// </div>

// {/* This todo is being edited */ }
// <div data-cy="Todo" className="todo">
//   <label className="todo__status-label">
//     <input
//       data-cy="TodoStatus"
//       type="checkbox"
//       className="todo__status"
//     />
//   </label>

//   {/* This form is shown instead of the title and remove button */}
//   <form>
//     <input
//       data-cy="TodoTitleField"
//       type="text"
//       className="todo__title-field"
//       placeholder="Empty todo will be deleted"
//       value="Todo is being edited now"
//     />
//   </form>

//   <div data-cy="TodoLoader" className="modal overlay">
//     <div className="modal-background has-background-white-ter" />
//     <div className="loader" />
//   </div>
// </div>

// {/* This todo is in loadind state */ }
// <div data-cy="Todo" className="todo">
//   <label className="todo__status-label">
//     <input
//       data-cy="TodoStatus"
//       type="checkbox"
//       className="todo__status"
//     />
//   </label>

//   <span data-cy="TodoTitle" className="todo__title">
//     Todo is being saved now
//   </span>

//   <button
//     type="button"
//     className="todo__remove"
//     data-cy="TodoDelete"
//   >
//     ×
//   </button>

//   {/* 'is-active' class puts this modal on top of the todo */}
//   <div data-cy="TodoLoader" className="modal overlay is-active">
//     <div className="modal-background has-background-white-ter" />
//     <div className="loader" />
//   </div>
// </div>
