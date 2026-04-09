// URL base do servidor backend
const BASE_URL = "http://127.0.0.1:8000";

// --- AUTH (Autenticação: Login e Registro) ---
const postUser = async (event) => {
    event.preventDefault();
    
    let payload = {
        name: document.getElementById("regName").value,
        email: document.getElementById("regEmail").value,
        password: document.getElementById("regPassword").value
    };
    
    try {
        const res = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert("Cadastro realizado com sucesso!");
            window.location.href = "login.html";
        } else {
            const error = await res.json();
            alert("Erro no cadastro: " + (error.message || "Tente novamente"));
        }
    } catch (e) {
        console.error("Erro ao registrar:", e);
        alert("Erro de conexão com o servidor");
    }
};

const loginUser = async (event) => {
    event.preventDefault();
    
    let payload = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };
    
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            const token = result.data?.access_token || result.access_token || result.token;
            localStorage.setItem("token", token);
            window.location.href = "index.html";
        } else {
            alert("Falha no login: " + (result.message || "Credenciais inválidas"));
        }
    } catch (e) {
        console.error("Erro ao fazer login:", e);
        alert("Erro de conexão com o servidor");
    }
};

// --- CRUD DE TAREFAS ---

const getTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/tasks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        const result = await res.json();
        
        // CORREÇÃO: O servidor retorna {tasks: [...]}
        const tasks = Array.isArray(result) ? result : (result.tasks || result.data || []);
        renderTasks(tasks);
    } catch (e) {
        console.error("Erro ao listar tarefas:", e);
    }
};

const addTask = async () => {
    const input = document.getElementById("taskDesc");
    const token = localStorage.getItem("token");

    if (!input.value.trim()) {
        alert("Digite uma tarefa!");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title: input.value.trim() })
        });

        if (response.ok) {
            input.value = "";
            await getTasks();
        } else {
            const error = await response.json();
            alert("Erro ao salvar: " + (error.error || error.message || "Tente novamente"));
        }
    } catch (e) {
        console.error("Erro ao adicionar tarefa:", e);
        alert("Erro de conexão com o servidor");
    }
};

function renderTasks(tasks) {
    const list = document.getElementById("taskList");
    if (!list) return;

    list.innerHTML = "";

    if (!tasks || tasks.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #666;">Nenhuma tarefa encontrada.</li>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: #fff;';
        
        const span = document.createElement('span');
        span.textContent = task.title;
        span.style.flex = '1';
        
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.style.cssText = 'display: flex; gap: 5px;';
        
        const btnEdit = document.createElement('button');
        btnEdit.textContent = 'Editar';
        btnEdit.className = 'btn-edit';
        btnEdit.onclick = () => updateTask(task.id || task._id);
        
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Excluir';
        btnDelete.className = 'btn-delete';
        btnDelete.onclick = () => deleteTask(task.id || task._id);
        
        actions.appendChild(btnEdit);
        actions.appendChild(btnDelete);
        li.appendChild(span);
        li.appendChild(actions);
        list.appendChild(li);
    });
}

async function updateTask(id) {
    const newTitle = prompt("Digite o novo título da tarefa:");
    if (!newTitle || !newTitle.trim()) return;
    
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${BASE_URL}/tasks/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle.trim() })
        });
        
        if (res.ok) {
            await getTasks();
        } else {
            alert("Erro ao atualizar tarefa");
        }
    } catch (e) {
        console.error("Erro ao atualizar tarefa:", e);
    }
}

async function deleteTask(id) {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${BASE_URL}/tasks/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
            await getTasks();
        } else {
            alert("Erro ao excluir tarefa");
        }
    } catch (e) {
        console.error("Erro ao excluir tarefa:", e);
    }
}

window.updateTask = updateTask;
window.deleteTask = deleteTask;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("registerForm")?.addEventListener("submit", postUser);
    document.getElementById("loginForm")?.addEventListener("submit", loginUser);
    document.getElementById("addTaskBtn")?.addEventListener("click", addTask);
    
    document.getElementById("taskDesc")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });
    
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    const path = window.location.pathname;
    if (path.includes("index.html") || path.endsWith("/") || path.endsWith("/client/")) {
        if (!localStorage.getItem("token")) {
            window.location.href = "login.html";
        } else {
            getTasks();
        }
    }
});
