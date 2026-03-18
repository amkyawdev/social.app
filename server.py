import os
import uuid
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host="ep-misty-mountain-anm9091x-pooler.c-6.us-east-1.aws.neon.tech",
        database="neondb",
        user="neondb_owner",
        password="npg_8t7hszNBxlwL",
        sslmode="require"
    )

# ==================== USERS ====================
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT id, name, username, email, avatar, avatar_icon, status, bio, followers, following, created_at FROM users ORDER BY created_at DESC')
    users = cur.fetchall()
    cur.close()
    conn.close()
    # Convert datetime to string
    for u in users:
        if u.get('created_at'):
            u['created_at'] = u['created_at'].isoformat()
    return jsonify(users)

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT id, name, username, email, avatar, avatar_icon, status, bio, followers, following, created_at FROM users WHERE id = %s', (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    user_id = str(uuid.uuid4())
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        INSERT INTO users (id, name, username, email, avatar, avatar_icon, status, bio)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, username, email, avatar, avatar_icon, status, bio, created_at
    ''', (user_id, data.get('name'), data.get('username'), data.get('email'), data.get('avatar'), 
          data.get('avatar_icon', 'fa-user'), data.get('status', 'offline'), data.get('bio', '')))
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify(user), 201
    return jsonify({'error': 'Failed to create user'}), 400

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        UPDATE users 
        SET name = COALESCE(%s, name),
            avatar = COALESCE(%s, avatar),
            avatar_icon = COALESCE(%s, avatar_icon),
            bio = COALESCE(%s, bio),
            background_photo = COALESCE(%s, background_photo)
        WHERE id = %s
        RETURNING id, name, username, email, avatar, avatar_icon, status, bio, created_at
    ''', (data.get('name'), data.get('avatar'), data.get('avatar_icon'), 
          data.get('bio'), data.get('background_photo'), user_id))
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

# ==================== POSTS ====================
@app.route('/api/posts', methods=['GET'])
def get_posts():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT p.id, p.user_id, p.content, p.image, p.likes, p.comments, p.created_at,
               u.name, u.username, u.avatar, u.avatar_icon
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
    ''')
    posts = cur.fetchall()
    cur.close()
    conn.close()
    for p in posts:
        if p.get('created_at'):
            p['created_at'] = p['created_at'].isoformat()
    return jsonify(posts)

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.json
    post_id = str(uuid.uuid4())
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        INSERT INTO posts (id, user_id, content, image)
        VALUES (%s, %s, %s, %s)
        RETURNING id, user_id, content, image, likes, comments, created_at
    ''', (post_id, data.get('user_id'), data.get('content'), data.get('image')))
    post = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if post:
        if post.get('created_at'):
            post['created_at'] = post['created_at'].isoformat()
        return jsonify(post), 201
    return jsonify({'error': 'Failed to create post'}), 400

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM posts WHERE id = %s RETURNING id', (post_id,))
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if result:
        return jsonify({'success': True})
    return jsonify({'error': 'Post not found'}), 404

# ==================== GROUPS ====================
@app.route('/api/groups', methods=['GET'])
def get_groups():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM groups ORDER BY created_at DESC')
    groups = cur.fetchall()
    cur.close()
    conn.close()
    for g in groups:
        if g.get('created_at'):
            g['created_at'] = g['created_at'].isoformat()
    return jsonify(groups)

@app.route('/api/groups', methods=['POST'])
def create_group():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    group_id = str(uuid.uuid4())
    cur.execute('''
        INSERT INTO groups (id, name, description, privacy, avatar, owner_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
    ''', (group_id, data.get('name'), data.get('description'), data.get('privacy', 'public'),
          data.get('avatar', 'fa-users'), data.get('owner_id')))
    group = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if group:
        if group.get('created_at'):
            group['created_at'] = group['created_at'].isoformat()
        return jsonify(group), 201
    return jsonify({'error': 'Failed to create group'}), 400

# ==================== MESSAGES ====================
@app.route('/api/messages/<user_id1>/<user_id2>', methods=['GET'])
def get_messages(user_id1, user_id2):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT * FROM messages 
        WHERE (sender_id = %s AND receiver_id = %s) 
           OR (sender_id = %s AND receiver_id = %s)
        ORDER BY created_at ASC
    ''', (user_id1, user_id2, user_id2, user_id1))
    messages = cur.fetchall()
    cur.close()
    conn.close()
    for m in messages:
        if m.get('created_at'):
            m['created_at'] = m['created_at'].isoformat()
    return jsonify(messages)

@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    message_id = str(uuid.uuid4())
    cur.execute('''
        INSERT INTO messages (id, sender_id, receiver_id, content, image)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
    ''', (message_id, data.get('sender_id'), data.get('receiver_id'), data.get('content'), data.get('image')))
    message = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if message:
        if message.get('created_at'):
            message['created_at'] = message['created_at'].isoformat()
        return jsonify(message), 201
    return jsonify({'error': 'Failed to send message'}), 400

# ==================== NOTIFICATIONS ====================
@app.route('/api/notifications/<user_id>', methods=['GET'])
def get_notifications(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT * FROM notifications 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 20
    ''', (user_id,))
    notifications = cur.fetchall()
    cur.close()
    conn.close()
    for n in notifications:
        if n.get('created_at'):
            n['created_at'] = n['created_at'].isoformat()
    return jsonify(notifications)

# ==================== AUTH ====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify({'success': True, 'user': user})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if user exists
    cur.execute('SELECT id FROM users WHERE email = %s OR username = %s', 
                (data.get('email'), data.get('username')))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'success': False, 'message': 'User already exists'}), 400
    
    user_id = str(uuid.uuid4())
    # Create user
    cur.execute('''
        INSERT INTO users (id, name, username, email, avatar_icon, status, bio)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, username, email, avatar_icon, status, bio, created_at
    ''', (user_id, data.get('name'), data.get('username'), data.get('email'),
          data.get('avatar_icon', 'fa-user'), 'online', data.get('bio', '')))
    
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        return jsonify({'success': True, 'user': user}), 201
    
    return jsonify({'success': False, 'message': 'Failed to register'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
