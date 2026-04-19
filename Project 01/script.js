const SUPABASE_URL = 'https://usuxjrmhwgiefrhimvxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdXhqcm1od2dpZWZyaGltdnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTM2MTcsImV4cCI6MjA5MDUyOTYxN30.MrpVZIWrivWJCNFjIHoaFO4tz2PWLEFP5CI6XlWB7EU';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Check login
const userEmail = localStorage.getItem('userEmail');
const userRole  = localStorage.getItem('userRole');
const userName  = localStorage.getItem('userName');

if (!userEmail) window.location.href = './login.html';

const input        = document.getElementById('taskInput');
const addBtn       = document.getElementById('addBtn');
const list         = document.getElementById('taskList');
const emptyState   = document.getElementById('emptyState');
const totalCount   = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const doneCount    = document.getElementById('doneCount');
const workerSelect = document.getElementById('workerSelect');
const prioritySelect = document.getElementById('prioritySelect');
const deadlineInput  = document.getElementById('deadlineInput');

// Show manager controls only for manager
if (userRole !== 'manager') {
  document.getElementById('managerControls').style.display = 'none';
}

// Show logged in user
document.getElementById('userInfo').innerHTML =
  `👤 <span style="color:#ec4899;">${userName}</span> <span style="color:rgba(255,255,255,0.4);font-size:11px;">(${userRole})</span>
  <button onclick="logout()" style="margin-left:12px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;cursor:pointer;">Logout</button>`;

function logout() {
  localStorage.clear();
  window.location.href = './login.html';
}

async function loadTasks() {
  let query = db.from('tasks').select('*').order('created_at', { ascending: false });
  if (userRole === 'worker') query = query.eq('assigned_to', userName);
  const { data, error } = await query;
  if (error) { console.error(error); return; }
  render(data);
}

function getStatusStyle(status) {
  if (status === 'pending')     return 'background:#ec489922;color:#ec4899;';
  if (status === 'in-progress') return 'background:#f59e0b22;color:#f59e0b;';
  if (status === 'done')        return 'background:#c8f40022;color:#c8f400;';
  return '';
}

function getStatusLabel(status) {
  if (status === 'pending')     return '🔴 Pending';
  if (status === 'in-progress') return '🟡 In Progress';
  if (status === 'done')        return '🟢 Done';
  return status;
}

function render(tasks) {
  list.innerHTML = '';
  emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
  totalCount.textContent   = tasks.length;
  pendingCount.textContent = tasks.filter(t => t.status === 'pending').length;
  doneCount.textContent    = tasks.filter(t => t.status === 'done').length;

tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const priorityColor =
      task.priority === 'high'   ? '#ec4899' :
      task.priority === 'medium' ? '#f59e0b' : '#c8f400';
    const priorityLabel =
      task.priority === 'high'   ? '🔴 High' :
      task.priority === 'medium' ? '🟡 Medium' : '🟢 Low';
    const deadlineStr = task.deadline
      ? `<span style="font-size:11px;color:#f59e0b;">📅 ${task.deadline}</span>`
      : '';

    li.innerHTML = `
      <div style="width:100%;">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <span style="color:#fff;display:block;margin-bottom:6px;">${task.text}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${task.assigned_to ? `<span style="font-size:11px;color:#ec4899;">👤 ${task.assigned_to}</span>` : ''}
              <span style="font-size:11px;padding:2px 10px;border-radius:999px;${getStatusStyle(task.status)}">${getStatusLabel(task.status)}</span>
              <span style="font-size:11px;padding:2px 10px;border-radius:999px;background:${priorityColor}22;color:${priorityColor};">${priorityLabel}</span>
              ${deadlineStr}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
            <select class="status-select" data-id="${task.id}" style="background:rgba(255,255,255,0.08);border:none;border-radius:8px;padding:4px 8px;color:#fff;font-size:12px;cursor:pointer;outline:none;">
              <option value="pending"     ${task.status === 'pending'     ? 'selected' : ''}>🔴 Pending</option>
              <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>🟡 In Progress</option>
              <option value="done"        ${task.status === 'done'        ? 'selected' : ''}>🟢 Done</option>
            </select>
            ${userRole === 'manager' ? `<button class="del-btn" data-id="${task.id}" style="background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;">×</button>` : ''}
          </div>
        </div>

        <!-- Comment Section -->
        <div style="margin-top:10px;">
          <button class="comment-toggle" data-id="${task.id}"
            style="background:transparent;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:11px;padding:3px 10px;border-radius:999px;cursor:pointer;">
            💬 Comments
          </button>
          <div class="comment-box" data-id="${task.id}" style="display:none;margin-top:8px;">
            <div class="comment-list" data-id="${task.id}" style="margin-bottom:8px;max-height:120px;overflow-y:auto;"></div>
            <div style="display:flex;gap:6px;">
              <input class="comment-input" data-id="${task.id}"
                style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 10px;color:#fff;font-size:12px;outline:none;"
                placeholder="Write a comment..." />
              <button class="comment-send" data-id="${task.id}"
                style="background:#ec4899;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  });

  // ===== COMMENTS =====
async function loadComments(taskId) {
  const { data } = await db
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  const container = document.querySelector(`.comment-list[data-id="${taskId}"]`);
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:11px;">No comments yet</p>';
    return;
  }

  container.innerHTML = data.map(c => `
    <div style="margin-bottom:6px;padding:6px 10px;background:rgba(255,255,255,0.05);border-radius:8px;">
      <span style="color:#ec4899;font-size:11px;font-weight:700;">👤 ${c.user_name}</span>
      <p style="color:#fff;font-size:12px;margin:2px 0 0;">${c.message}</p>
      <p style="color:rgba(255,255,255,0.3);font-size:10px;margin:2px 0 0;">${new Date(c.created_at).toLocaleString()}</p>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

async function sendComment(taskId, message) {
  if (!message.trim()) return;
  await db.from('comments').insert({
    task_id:   taskId,
    user_name: userName,
    message:   message.trim()
  });
  loadComments(taskId);
}

 document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const newStatus = sel.value;
      await db.from('tasks').update({ status: newStatus }).eq('id', sel.dataset.id);

      // Notification bhejo agar done kiya
      if (newStatus === 'done') {
        const taskText = sel.closest('li').querySelector('span').textContent;
        await db.from('notifications').insert({
          message: `✅ ${userName} ne "${taskText}" complete kiya!`,
          for_role: 'manager',
          is_read: false
        });
      }
      loadTasks();
      loadNotifications();
    });
  });

 document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await db.from('tasks').delete().eq('id', btn.dataset.id);
      loadTasks();
    });
  });

  // Comment toggle
  document.querySelectorAll('.comment-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = document.querySelector(`.comment-box[data-id="${btn.dataset.id}"]`);
      const isOpen = box.style.display === 'block';
      box.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) loadComments(btn.dataset.id);
    });
  });

  // Send comment
  document.querySelectorAll('.comment-send').forEach(btn => {
    btn.addEventListener('click', async () => {
      const inp = document.querySelector(`.comment-input[data-id="${btn.dataset.id}"]`);
      await sendComment(btn.dataset.id, inp.value);
      inp.value = '';
    });
  });

  // Enter key comment
  document.querySelectorAll('.comment-input').forEach(inp => {
    inp.addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        await sendComment(inp.dataset.id, inp.value);
        inp.value = '';
      }
    });
  });
}
async function addTask() {
  const val      = input.value.trim();
  const worker   = workerSelect.value;
  const priority = prioritySelect.value;
  const deadline = deadlineInput.value;
  if (!val) return;
  await db.from('tasks').insert({
    text:        val,
    done:        false,
    status:      'pending',
    assigned_to: worker   || null,
    priority:    priority || 'medium',
    deadline:    deadline || null
  });
  input.value         = '';
  workerSelect.value  = '';
  deadlineInput.value = '';
  loadTasks();
}

addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

db.channel('tasks-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
    loadTasks();
  })
  .subscribe();
   
    // ===== NOTIFICATIONS =====
async function loadNotifications() {
  if (userRole !== 'manager') return;
  const { data } = await db
    .from('notifications')
    .select('*')
    .eq('for_role', 'manager')
    .order('created_at', { ascending: false })
    .limit(10);

  const unread = data.filter(n => !n.is_read).length;
  const badge  = document.getElementById('notifBadge');
  const list   = document.getElementById('notifList');

  badge.style.display  = unread > 0 ? 'block' : 'none';
  badge.textContent    = unread;

  if (data.length === 0) {
    list.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:13px;">No notifications</p>';
    return;
  }

  list.innerHTML = data.map(n => `
    <div style="padding:8px;border-radius:8px;margin-bottom:6px;background:${n.is_read ? 'transparent' : 'rgba(236,72,153,0.1)'};border-left:3px solid ${n.is_read ? 'transparent' : '#ec4899'};">
      <p style="color:#fff;font-size:12px;margin:0;">${n.message}</p>
      <p style="color:rgba(255,255,255,0.3);font-size:10px;margin:4px 0 0;">${new Date(n.created_at).toLocaleString()}</p>
    </div>
  `).join('');
}

function toggleNotifications() {
  const dd = document.getElementById('notifDropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  if (dd.style.display === 'block') loadNotifications();
}

async function markAllRead() {
  await db.from('notifications').update({ is_read: true }).eq('for_role', 'manager');
  loadNotifications();
}

// Realtime notifications
db.channel('notif-channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
    loadNotifications();
  })
  .subscribe();

loadNotifications();

loadTasks();
loadNotifications(); 