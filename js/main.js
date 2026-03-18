// =====================================================
// WAYNE Social Community - Main Application (No Auth Check)
// =====================================================

// ===== Configuration =====
const API_URL = '/api';
const CLOUD_NAME = 'dgzzn5aoa';
const CLOUDINARY_API_KEY = '6GjriDZR3pl2Dr_BjbBFohhOpOk';
const UPLOAD_PRESET = 'amkdev';

// ===== Default User (No Auth) =====
const CURRENT_USER = {
    id: "1",
    name: "မောင်မောင်",
    username: "wayne_user",
    email: "mgmg@test.com",
    avatar_icon: "fa-user-astronaut",
    avatar: null,
    background_photo: null,
    bio: "Web Developer & Designer",
    status: "online",
    followers: 124,
    following: 86,
    created_at: new Date().toISOString()
};

// ===== Avatar Icons List =====
const AVATAR_ICONS = [
    'fa-user-astronaut', 'fa-user-ninja', 'fa-user-secret', 'fa-user-tie',
    'fa-cat', 'fa-dog', 'fa-dragon', 'fa-fish',
    'fa-tree', 'fa-leaf', 'fa-pizza-slice', 'fa-crown',
    'fa-rocket', 'fa-car', 'fa-bicycle', 'fa-motorcycle',
    'fa-gamepad', 'fa-headphones', 'fa-camera', 'fa-plane',
    'fa-star', 'fa-heart', 'fa-sun', 'fa-moon'
];

// ===== Global Variables =====
let posts = [];
let users = [];
let groups = [];
let friends = [];
let blockedUsers = [];
let currentChatUser = null;
let currentChatGroup = null;
let messageInterval = null;
let selectedImage = null;
let selectedAvatarFile = null;
let selectedBackgroundFile = null;
let selectedGroupAvatar = 'fa-users';
let selectedUserAvatar = CURRENT_USER.avatar_icon || 'fa-user-astronaut';

// ===== API Request Helper =====
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// ===== Three.js Background =====
function initThreeBackground() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a042e);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Layer 1 - Distant stars
    const particles1 = createParticleLayer(1500, 200, 0.2, 0.4, 0.3);
    scene.add(particles1);
    
    // Layer 2 - Medium particles
    const particles2 = createParticleLayer(800, 100, 0.15, 0.7, 0.8);
    scene.add(particles2);
    
    // Layer 3 - Close particles
    const particles3 = createParticleLayer(300, 40, 0.25, 0.9, 1.0);
    scene.add(particles3);
    
    camera.position.z = 30;
    
    function createParticleLayer(count, spread, size, opacity, saturation) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * spread;
            positions[i+1] = (Math.random() - 0.5) * spread;
            positions[i+2] = (Math.random() - 0.5) * spread;
            
            const color = new THREE.Color();
            if (Math.random() > 0.5) {
                color.setHSL(0.6 + Math.random() * 0.2, saturation, 0.5);
            } else {
                color.setHSL(0.8 + Math.random() * 0.1, saturation, 0.5);
            }
            
            colors[i] = color.r;
            colors[i+1] = color.g;
            colors[i+2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Points(geometry, material);
    }
    
    function animate() {
        requestAnimationFrame(animate);
        if (particles1) particles1.rotation.y += 0.0001;
        if (particles2) particles2.rotation.y += 0.0003;
        if (particles3) particles3.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ===== Initialize Avatar Selectors =====
function initAvatarSelectors() {
    const groupSelector = document.getElementById('groupAvatarSelector');
    const userSelector = document.getElementById('userAvatarSelector');
    
    if (groupSelector) {
        groupSelector.innerHTML = AVATAR_ICONS.map(icon => `
            <div class="avatar-option" onclick="selectGroupAvatar('${icon}')">
                <i class="fas ${icon}"></i>
            </div>
        `).join('');
    }
    
    if (userSelector) {
        userSelector.innerHTML = AVATAR_ICONS.map(icon => `
            <div class="avatar-option" onclick="selectUserAvatar('${icon}')">
                <i class="fas ${icon}"></i>
            </div>
        `).join('');
    }
}

window.selectGroupAvatar = function(icon) {
    selectedGroupAvatar = icon;
    document.getElementById('groupAvatarPreview').innerHTML = `<i class="fas ${icon}"></i>`;
    
    document.querySelectorAll('#groupAvatarSelector .avatar-option').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
};

window.selectUserAvatar = function(icon) {
    selectedUserAvatar = icon;
    document.getElementById('userAvatarPreview').innerHTML = `<i class="fas ${icon}"></i>`;
    
    document.querySelectorAll('#userAvatarSelector .avatar-option').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
};

// ===== Load Data =====
async function loadPosts() {
    try {
        const res = await apiRequest('/posts');
        posts = await res.json();
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        // Fallback data
        posts = [
            {
                id: "1",
                user_id: "1",
                name: "မောင်မောင်",
                username: "wayne_user",
                content: "Welcome to WAYNE Social Community! 🎉",
                likes: 124,
                comments: 18,
                created_at: new Date().toISOString()
            }
        ];
        renderPosts();
    }
}

async function loadUsers() {
    try {
        const res = await apiRequest('/users');
        users = await res.json();
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

async function loadFriends() {
    try {
        const res = await apiRequest('/users');
        const allUsers = await res.json();
        users = allUsers;
        
        const container = document.getElementById('friendsContainer');
        if (!container) return;
        
        container.innerHTML = allUsers.map(user => `
            <div class="mini-card" onclick="openChat('${user.id}', '${user.name}', '${user.avatar || user.avatar_icon || 'fa-user-circle'}', '${user.status || 'offline'}')">
                <div class="mini-avatar">
                    ${user.avatar ? 
                        `<img src="${user.avatar}" alt="${user.name}">` : 
                        `<i class="fas ${user.avatar_icon || 'fa-user-circle'}"></i>`
                    }
                </div>
                <div class="mini-info">
                    <h4>${user.name}</h4>
                    <p>
                        <span class="status-dot ${user.status === 'online' ? 'online' : 'offline'}"></span>
                        ${user.status || 'offline'}
                    </p>
                </div>
                <div class="mini-actions">
                    <button class="mini-action" onclick="addFriend('${user.id}')" title="Add Friend">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="mini-action" onclick="blockUser('${user.id}')" title="Block">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        loadChatUsers();
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function loadGroups() {
    try {
        const res = await apiRequest('/groups');
        groups = await res.json();
        
        const container = document.getElementById('groupsContainer');
        if (!container) return;
        
        container.innerHTML = groups.map(group => `
            <div class="mini-card" onclick="showGroupDetail('${group.id}')">
                <div class="mini-avatar">
                    <i class="fas ${group.avatar || 'fa-users'}"></i>
                </div>
                <div class="mini-info">
                    <h4>${group.name}</h4>
                    <p>${group.members || 0} members</p>
                    <span class="mini-badge">${group.privacy}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function loadChatUsers() {
    const container = document.getElementById('chatUsersList');
    if (!container) return;
    
    container.innerHTML = users.map(user => `
        <div class="mini-card" onclick="openChat('${user.id}', '${user.name}', '${user.avatar || user.avatar_icon || 'fa-user-circle'}', '${user.status || 'offline'}')">
            <div class="mini-avatar">
                ${user.avatar ? 
                    `<img src="${user.avatar}" alt="${user.name}">` : 
                    `<i class="fas ${user.avatar_icon || 'fa-user-circle'}"></i>`
                }
            </div>
            <div class="mini-info">
                <h4>${user.name}</h4>
                <p>
                    <span class="status-dot ${user.status === 'online' ? 'online' : 'offline'}"></span>
                    ${user.status || 'offline'}
                </p>
            </div>
        </div>
    `).join('');
}

async function loadNotifications() {
    try {
        const res = await apiRequest(`/notifications?user_id=eq.${CURRENT_USER.id}&read=eq.false`);
        const notifications = await res.json();
        
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;
        
        if (notifications.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = notifications.length;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// ===== Render Posts =====
function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    container.innerHTML = posts.map(post => {
        const user = users.find(u => u.id === post.user_id) || {};
        return `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-avatar" onclick="viewProfile('${post.user_id}')">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.name}">` : 
                            `<i class="fas ${user.avatar_icon || 'fa-user-circle'}"></i>`
                        }
                    </div>
                    <div class="post-user">
                        <h4 onclick="viewProfile('${post.user_id}')">${user.name || post.username}</h4>
                        <span class="post-time"><i class="far fa-clock"></i> ${new Date(post.created_at).toLocaleString()}</span>
                    </div>
                </div>
                ${post.image ? `
                    <div class="post-image" onclick="viewImage('${post.image}')">
                        <img src="${post.image}" alt="Post image">
                    </div>
                ` : ''}
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <span class="action-tiny" onclick="likePost('${post.id}')">
                        <i class="far fa-heart"></i> ${post.likes || 0}
                    </span>
                    <span class="action-tiny" onclick="toggleComments('${post.id}')">
                        <i class="far fa-comment"></i> ${post.comments || 0}
                    </span>
                </div>
                <div id="comments-${post.id}" class="comment-section" style="display: none;">
                    <div class="comment-input-wrapper">
                        <input type="text" id="comment-${post.id}" class="comment-input" placeholder="Write a comment...">
                        <button class="hamburger-send-btn" onclick="addComment('${post.id}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div id="comments-list-${post.id}" class="comments-list"></div>
                </div>
            </div>
        `;
    }).join('');
    
    // Load comments for each post
    posts.forEach(post => {
        if (post.comments > 0) loadComments(post.id);
    });
}

// ===== Comments =====
async function loadComments(postId) {
    try {
        const res = await apiRequest(`/comments?post_id=eq.${postId}`);
        const comments = await res.json();
        
        const container = document.getElementById(`comments-list-${postId}`);
        if (!container) return;
        
        container.innerHTML = comments.map(comment => {
            const user = users.find(u => u.id === comment.user_id) || {};
            return `
                <div class="comment-item">
                    <div class="comment-author">${user.name || 'User'}</div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-time">${new Date(comment.created_at).toLocaleString()}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

window.addComment = async function(postId) {
    const input = document.getElementById(`comment-${postId}`);
    const content = input.value.trim();
    if (!content) return;
    
    try {
        await apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify({
                id: String(Date.now()),
                post_id: postId,
                user_id: CURRENT_USER.id,
                content: content,
                created_at: new Date().toISOString()
            })
        });
        
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.comments = (post.comments || 0) + 1;
        }
        
        input.value = '';
        await loadComments(postId);
        renderPosts();
    } catch (error) {
        console.error('Error adding comment:', error);
    }
};

window.toggleComments = function(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv) {
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
        if (commentsDiv.style.display === 'block') {
            loadComments(postId);
        }
    }
};

// ===== Like Post =====
window.likePost = async function(postId) {
    try {
        const checkRes = await apiRequest(`/likes?post_id=eq.${postId}&user_id=eq.${CURRENT_USER.id}`);
        const existing = await checkRes.json();
        
        if (existing.length === 0) {
            await apiRequest('/likes', {
                method: 'POST',
                body: JSON.stringify({
                    id: String(Date.now()),
                    post_id: postId,
                    user_id: CURRENT_USER.id,
                    created_at: new Date().toISOString()
                })
            });
            
            const post = posts.find(p => p.id === postId);
            if (post) {
                post.likes = (post.likes || 0) + 1;
            }
            
            renderPosts();
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
};

// ===== Upload Post =====
window.triggerImageUpload = function() {
    document.getElementById('imageInput').click();
};

document.getElementById('imageInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('previewImg');
            const previewDiv = document.getElementById('imagePreview');
            if (preview && previewDiv) {
                preview.src = e.target.result;
                previewDiv.style.display = 'block';
                selectedImage = file;
            }
        };
        reader.readAsDataURL(file);
    }
});

window.removeImage = function() {
    const previewDiv = document.getElementById('imagePreview');
    const fileInput = document.getElementById('imageInput');
    if (previewDiv) previewDiv.style.display = 'none';
    if (fileInput) fileInput.value = '';
    selectedImage = null;
};

async function uploadImageToCloudinary(file, folder = 'posts') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

window.uploadPost = async function() {
    const input = document.getElementById('postInput');
    const content = input.value.trim();
    if (!content && !selectedImage) return;
    
    try {
        let imageUrl = null;
        if (selectedImage) {
            imageUrl = await uploadImageToCloudinary(selectedImage, 'posts');
        }
        
        const newPost = {
            id: String(Date.now()),
            user_id: CURRENT_USER.id,
            username: CURRENT_USER.username,
            content: content || '',
            image: imageUrl,
            likes: 0,
            comments: 0,
            created_at: new Date().toISOString()
        };
        
        await apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(newPost)
        });
        
        posts.unshift(newPost);
        renderPosts();
        input.value = '';
        removeImage();
    } catch (error) {
        console.error('Error uploading post:', error);
    }
};

// ===== Create Group =====
window.showCreateGroupModal = function() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        selectedGroupAvatar = 'fa-users';
        const preview = document.getElementById('groupAvatarPreview');
        if (preview) preview.innerHTML = '<i class="fas fa-users"></i>';
        modal.style.display = 'flex';
    }
};

window.hideCreateGroupModal = function() {
    const modal = document.getElementById('createGroupModal');
    if (modal) modal.style.display = 'none';
};

window.createGroup = async function() {
    const name = document.getElementById('newGroupName')?.value.trim();
    const description = document.getElementById('newGroupDescription')?.value.trim();
    const privacy = document.querySelector('input[name="groupPrivacy"]:checked')?.value;
    
    if (!name) {
        alert('Group name is required');
        return;
    }
    
    try {
        const newGroup = {
            id: String(Date.now()),
            name: name,
            description: description || `${name} group`,
            privacy: privacy || 'public',
            created_by: CURRENT_USER.id,
            members: 1,
            avatar: selectedGroupAvatar,
            created_at: new Date().toISOString()
        };
        
        await apiRequest('/groups', {
            method: 'POST',
            body: JSON.stringify(newGroup)
        });
        
        await apiRequest('/group_members', {
            method: 'POST',
            body: JSON.stringify({
                id: String(Date.now()),
                group_id: newGroup.id,
                user_id: CURRENT_USER.id,
                role: 'admin',
                status: 'approved',
                joined_at: new Date().toISOString()
            })
        });
        
        hideCreateGroupModal();
        const nameInput = document.getElementById('newGroupName');
        const descInput = document.getElementById('newGroupDescription');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        await loadGroups();
        alert('Group created successfully!');
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group');
    }
};

// ===== Group Detail =====
window.showGroupDetail = async function(groupId) {
    try {
        const groupRes = await apiRequest(`/groups?id=eq.${groupId}`);
        const groups = await groupRes.json();
        const group = groups[0];
        
        const membersRes = await apiRequest(`/group_members?group_id=eq.${groupId}`);
        const members = await membersRes.json();
        
        const isAdmin = members.some(m => m.user_id === CURRENT_USER.id && m.role === 'admin');
        
        // Get member details
        const userIds = members.map(m => m.user_id);
        const usersRes = await apiRequest('/users');
        const allUsers = await usersRes.json();
        const groupUsers = allUsers.filter(u => userIds.includes(u.id));
        
        const container = document.getElementById('groupDetailContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="post-card">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div class="post-avatar" style="width: 60px; height: 60px;">
                        <i class="fas ${group.avatar || 'fa-users'}"></i>
                    </div>
                    <div>
                        <h2 style="color: var(--accent);">${group.name}</h2>
                        <p style="color: var(--text-soft);">${group.description || ''}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <span class="mini-badge" style="margin-right: 10px;">${group.members || 0} members</span>
                    <span class="mini-badge">${group.privacy}</span>
                </div>
                
                <h3 style="margin: 20px 0 10px;">Members</h3>
                <div class="grid-mini">
                    ${groupUsers.map(user => {
                        const member = members.find(m => m.user_id === user.id);
                        return `
                            <div class="mini-card">
                                <div class="mini-avatar">
                                    ${user.avatar ? 
                                        `<img src="${user.avatar}" alt="${user.name}">` : 
                                        `<i class="fas ${user.avatar_icon || 'fa-user-circle'}"></i>`
                                    }
                                </div>
                                <div class="mini-info">
                                    <h4>${user.name}</h4>
                                    <p>${member.role}</p>
                                </div>
                                ${isAdmin && user.id !== CURRENT_USER.id ? `
                                    <div class="mini-actions">
                                        <button class="mini-action" onclick="kickFromGroup('${groupId}', '${user.id}')">
                                            <i class="fas fa-user-minus"></i>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        const nameSpan = document.getElementById('groupDetailName');
        if (nameSpan) nameSpan.textContent = group.name;
        showSection('groupDetail');
    } catch (error) {
        console.error('Error loading group detail:', error);
    }
};

// ===== Kick from Group =====
window.kickFromGroup = async function(groupId, userId) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
        await apiRequest(`/group_members?group_id=eq.${groupId}&user_id=eq.${userId}`, {
            method: 'DELETE'
        });
        
        const groupRes = await apiRequest(`/groups?id=eq.${groupId}`);
        const groups = await groupRes.json();
        const group = groups[0];
        
        await apiRequest(`/groups?id=eq.${groupId}`, {
            method: 'PATCH',
            body: JSON.stringify({ members: (group.members || 1) - 1 })
        });
        
        showGroupDetail(groupId);
    } catch (error) {
        console.error('Error kicking member:', error);
    }
};

// ===== Block User =====
window.blockUser = function(userId) {
    if (!confirm('Block this user? They will not be able to contact you.')) return;
    
    if (!blockedUsers.includes(userId)) {
        blockedUsers.push(userId);
        alert('User blocked');
    }
};

// ===== Add Friend =====
window.addFriend = async function(userId) {
    try {
        await apiRequest('/friends', {
            method: 'POST',
            body: JSON.stringify({
                id: String(Date.now()),
                user_id: CURRENT_USER.id,
                friend_id: userId,
                status: 'pending',
                created_at: new Date().toISOString()
            })
        });
        
        alert('Friend request sent');
    } catch (error) {
        console.error('Error adding friend:', error);
    }
};

// ===== Profile =====
async function loadProfile() {
    try {
        const userRes = await apiRequest(`/users?id=eq.${CURRENT_USER.id}`);
        const users = await userRes.json();
        const user = users[0] || CURRENT_USER;
        
        const postsRes = await apiRequest(`/posts?user_id=eq.${CURRENT_USER.id}&order=created_at.desc`);
        const userPosts = await postsRes.json();
        
        const profileCard = document.getElementById('profileCard');
        if (!profileCard) return;
        
        profileCard.innerHTML = `
            <div class="profile-cover">
                ${user.background_photo ? `<img src="${user.background_photo}" alt="Cover">` : ''}
            </div>
            <div class="profile-avatar-wrapper" onclick="showEditProfileModal()">
                ${user.avatar ? 
                    `<img src="${user.avatar}" alt="${user.name}">` : 
                    `<i class="fas ${user.avatar_icon || 'fa-user-circle'}" style="font-size: 5rem; color: white;"></i>`
                }
            </div>
            <div class="profile-info">
                <h2>${user.name}</h2>
                <div class="username">@${user.username}</div>
                <div class="profile-bio">${user.bio || 'No bio yet'}</div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="value">${userPosts.length}</div>
                        <div class="label">Posts</div>
                    </div>
                    <div class="profile-stat">
                        <div class="value">${user.followers || 0}</div>
                        <div class="label">Followers</div>
                    </div>
                    <div class="profile-stat">
                        <div class="value">${user.following || 0}</div>
                        <div class="label">Following</div>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="profile-btn primary" onclick="showEditProfileModal()">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                </div>
            </div>
        `;
        
        const userPostsContainer = document.getElementById('userPostsContainer');
        if (userPostsContainer) {
            userPostsContainer.innerHTML = userPosts.map(post => `
                <div class="post-card">
                    <div class="post-content">${post.content}</div>
                    ${post.image ? `
                        <div class="post-image" onclick="viewImage('${post.image}')">
                            <img src="${post.image}" alt="Post image">
                        </div>
                    ` : ''}
                    <div class="post-actions">
                        <span class="action-tiny"><i class="far fa-heart"></i> ${post.likes || 0}</span>
                        <span class="action-tiny"><i class="far fa-comment"></i> ${post.comments || 0}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ===== Edit Profile =====
window.showEditProfileModal = function() {
    const nameInput = document.getElementById('editName');
    const bioInput = document.getElementById('editBio');
    const avatarPreview = document.getElementById('userAvatarPreview');
    const modal = document.getElementById('editProfileModal');
    
    if (nameInput) nameInput.value = CURRENT_USER.name;
    if (bioInput) bioInput.value = CURRENT_USER.bio || '';
    if (avatarPreview) avatarPreview.innerHTML = `<i class="fas ${selectedUserAvatar}"></i>`;
    if (modal) modal.style.display = 'flex';
};

window.hideEditProfileModal = function() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
    selectedAvatarFile = null;
    selectedBackgroundFile = null;
};

window.triggerAvatarUpload = function() {
    document.getElementById('avatarInput')?.click();
};

document.getElementById('avatarInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedAvatarFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('userAvatarPreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        };
        reader.readAsDataURL(file);
    }
});

window.triggerBackgroundUpload = function() {
    document.getElementById('backgroundInput')?.click();
};

document.getElementById('backgroundInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedBackgroundFile = file;
    }
});

window.saveProfile = async function() {
    const newName = document.getElementById('editName')?.value.trim();
    const newBio = document.getElementById('editBio')?.value.trim();
    
    if (!newName) {
        alert('Name is required');
        return;
    }
    
    try {
        let avatarUrl = CURRENT_USER.avatar;
        let bgUrl = CURRENT_USER.background_photo;
        
        if (selectedAvatarFile) {
            avatarUrl = await uploadImageToCloudinary(selectedAvatarFile, 'avatars');
        }
        
        if (selectedBackgroundFile) {
            bgUrl = await uploadImageToCloudinary(selectedBackgroundFile, 'backgrounds');
        }
        
        await apiRequest(`/users?id=eq.${CURRENT_USER.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name: newName,
                bio: newBio,
                avatar: avatarUrl,
                background_photo: bgUrl,
                avatar_icon: selectedUserAvatar
            })
        });
        
        CURRENT_USER.name = newName;
        CURRENT_USER.bio = newBio;
        CURRENT_USER.avatar = avatarUrl;
        CURRENT_USER.background_photo = bgUrl;
        CURRENT_USER.avatar_icon = selectedUserAvatar;
        
        hideEditProfileModal();
        loadProfile();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
    }
};

// ===== Chat Functions =====
window.openChat = function(userId, userName, userAvatar, userStatus) {
    currentChatUser = userId;
    
    const usersList = document.getElementById('chatUsersList');
    const chatBox = document.getElementById('chatBox');
    const userInfo = document.getElementById('chatUserInfo');
    
    if (usersList) usersList.style.display = 'none';
    if (chatBox) chatBox.style.display = 'block';
    
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="chat-user-avatar">
                ${userAvatar.startsWith('fa-') ? 
                    `<i class="fas ${userAvatar}"></i>` : 
                    `<img src="${userAvatar}" alt="${userName}">`
                }
            </div>
            <div class="chat-user-details">
                <h4>${userName}</h4>
                <p>
                    <span class="status-dot ${userStatus === 'online' ? 'online' : 'offline'}"></span>
                    ${userStatus}
                </p>
            </div>
        `;
    }
    
    loadMessages(userId);
    
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(() => loadMessages(userId), 2000);
};

window.hideChatBox = function() {
    const usersList = document.getElementById('chatUsersList');
    const chatBox = document.getElementById('chatBox');
    
    if (usersList) usersList.style.display = 'grid';
    if (chatBox) chatBox.style.display = 'none';
    
    if (messageInterval) {
        clearInterval(messageInterval);
        messageInterval = null;
    }
};

async function loadMessages(otherUserId) {
    if (blockedUsers.includes(otherUserId)) {
        const container = document.getElementById('chatMessages');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 20px;">You blocked this user</div>';
        }
        return;
    }
    
    try {
        const sentRes = await apiRequest(`/messages?sender_id=eq.${CURRENT_USER.id}&receiver_id=eq.${otherUserId}`);
        const sentMessages = await sentRes.json();
        
        const receivedRes = await apiRequest(`/messages?sender_id=eq.${otherUserId}&receiver_id=eq.${CURRENT_USER.id}`);
        const receivedMessages = await receivedRes.json();
        
        const allMessages = [...sentMessages, ...receivedMessages].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        );
        
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        if (allMessages.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px;">No messages yet</div>';
        } else {
            container.innerHTML = allMessages.map(msg => {
                const isMe = msg.sender_id === CURRENT_USER.id;
                return `
                    <div class="message-wrapper ${isMe ? 'sent' : 'received'}">
                        <div class="message-avatar">
                            ${isMe ? 
                                (CURRENT_USER.avatar ? 
                                    `<img src="${CURRENT_USER.avatar}" alt="${CURRENT_USER.name}">` : 
                                    `<i class="fas ${CURRENT_USER.avatar_icon || 'fa-user-circle'}"></i>`
                                ) : 
                                `<i class="fas ${users.find(u => u.id === otherUserId)?.avatar_icon || 'fa-user-circle'}"></i>`
                            }
                        </div>
                        <div class="message-bubble">
                            <div class="message-text">${msg.content}</div>
                            ${msg.image ? `<img src="${msg.image}" class="message-image" onclick="viewImage('${msg.image}')">` : ''}
                            <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

window.sendMessage = async function() {
    const input = document.getElementById('chatMessageInput');
    const content = input.value.trim();
    
    if (!content || !currentChatUser) return;
    
    try {
        await apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify({
                id: String(Date.now()),
                sender_id: CURRENT_USER.id,
                receiver_id: currentChatUser,
                content: content,
                created_at: new Date().toISOString()
            })
        });
        
        input.value = '';
        await loadMessages(currentChatUser);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

window.triggerChatImageUpload = function() {
    document.getElementById('chatImageInput')?.click();
};

document.getElementById('chatImageInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file && currentChatUser) {
        const imageUrl = await uploadImageToCloudinary(file, 'chat');
        if (imageUrl) {
            await apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify({
                    id: String(Date.now()),
                    sender_id: CURRENT_USER.id,
                    receiver_id: currentChatUser,
                    image: imageUrl,
                    created_at: new Date().toISOString()
                })
            });
            await loadMessages(currentChatUser);
        }
    }
});

// ===== Search =====
window.showSearch = function() {
    showSection('search');
};

window.performSearch = async function() {
    const query = document.getElementById('searchInput')?.value.toLowerCase();
    if (!query) return;
    
    try {
        const [usersRes, postsRes, groupsRes] = await Promise.all([
            apiRequest('/users'),
            apiRequest('/posts'),
            apiRequest('/groups')
        ]);
        
        const allUsers = await usersRes.json();
        const allPosts = await postsRes.json();
        const allGroups = await groupsRes.json();
        
        const filteredUsers = allUsers.filter(u => 
            u.name.toLowerCase().includes(query) || 
            u.username.toLowerCase().includes(query)
        );
        
        const filteredPosts = allPosts.filter(p => 
            p.content.toLowerCase().includes(query)
        );
        
        const filteredGroups = allGroups.filter(g => 
            g.name.toLowerCase().includes(query)
        );
        
        const resultsDiv = document.getElementById('searchResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = `
            <h3 style="color: var(--accent); margin: 20px 0 10px;">Users (${filteredUsers.length})</h3>
            <div class="grid-mini">
                ${filteredUsers.map(user => `
                    <div class="mini-card" onclick="openChat('${user.id}', '${user.name}', '${user.avatar || user.avatar_icon || 'fa-user-circle'}', '${user.status || 'offline'}')">
                        <div class="mini-avatar">
                            ${user.avatar ? 
                                `<img src="${user.avatar}" alt="${user.name}">` : 
                                `<i class="fas ${user.avatar_icon || 'fa-user-circle'}"></i>`
                            }
                        </div>
                        <div class="mini-info">
                            <h4>${user.name}</h4>
                            <p>@${user.username}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <h3 style="color: var(--accent); margin: 20px 0 10px;">Posts (${filteredPosts.length})</h3>
            ${filteredPosts.map(post => `
                <div class="post-card">
                    <div class="post-content">${post.content}</div>
                </div>
            `).join('')}
            
            <h3 style="color: var(--accent); margin: 20px 0 10px;">Groups (${filteredGroups.length})</h3>
            <div class="grid-mini">
                ${filteredGroups.map(group => `
                    <div class="mini-card" onclick="showGroupDetail('${group.id}')">
                        <div class="mini-avatar">
                            <i class="fas ${group.avatar || 'fa-users'}"></i>
                        </div>
                        <div class="mini-info">
                            <h4>${group.name}</h4>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error searching:', error);
    }
};

// ===== Theme Toggle =====
window.toggleTheme = function() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        if (icon) icon.className = 'fas fa-moon';
    } else {
        body.setAttribute('data-theme', 'light');
        if (icon) icon.className = 'fas fa-sun';
    }
};

// ===== Logout =====
window.logout = function() {
    window.location.href = 'auth/auth.html';
};

// ===== Section Navigation =====
window.showSection = function(section) {
    document.querySelectorAll('.section-page').forEach(el => el.classList.add('hidden'));
    
    const sections = {
        'search': 'searchSection',
        'feed': 'feedSection',
        'friends': 'friendsSection',
        'groups': 'groupsSection',
        'groupDetail': 'groupDetailSection',
        'chat': 'chatSection',
        'profile': 'profileSection'
    };
    
    if (sections[section]) {
        const element = document.getElementById(sections[section]);
        if (element) element.classList.remove('hidden');
    }
    
    if (section === 'profile') loadProfile();
    if (section === 'feed') loadPosts();
    if (section === 'friends') loadFriends();
    if (section === 'groups') loadGroups();
    if (section === 'search') {
        const results = document.getElementById('searchResults');
        if (results) results.innerHTML = '';
    }
    
    document.querySelectorAll('.menubar-item, .mobile-nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.textContent.toLowerCase().includes(section)) {
            el.classList.add('active');
        }
    });
};

// ===== Utility Functions =====
window.viewProfile = function(userId) {
    if (userId === CURRENT_USER.id) {
        showSection('profile');
    } else {
        alert(`View profile for user ${userId}`);
    }
};

window.viewImage = function(imageUrl) {
    window.open(imageUrl, '_blank');
};

window.showNotifications = function() {
    alert('Notifications coming soon!');
};

window.startVideoCall = function() {
    alert('Video call coming soon!');
};

// ===== Initialize =====
async function init() {
    initThreeBackground();
    initAvatarSelectors();
    await loadUsers();
    await loadPosts();
    await loadFriends();
    await loadGroups();
    await loadNotifications();
    showSection('feed');
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);