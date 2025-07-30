from flask import Flask, request, jsonify
from supabase import create_client, Client
from flask_cors import CORS
from serverless_wsgi import handle_request
import hashlib
import os

app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = "https://dodijnhzghlpgmdddklr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGlqbmh6Z2hscGdtZGRka2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTE3MTksImV4cCI6MjA2OTAyNzcxOX0.soz1ofVIZ3NeWkcE1yUCIylFiVry5nwvc9PvHn7TZQQ"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Login endpoint (user or admin)
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = hash_password(data.get('password'))
    security_code = data.get('security_code')
    favorite_food = data.get('favorite_food')

    # Check if admin
    admin = supabase.table('admins').select('*').eq('username', username).eq('password', password).execute()
    if admin.data:
        if admin.data[0]['security_code'] == security_code and admin.data[0]['favorite_food'] == favorite_food:
            return jsonify({'role': 'admin', 'id': admin.data[0]['id'], 'message': 'Login successful'})
    
    # Check if user
    user = supabase.table('users').select('*').eq('username', username).eq('password', password).execute()
    if user.data:
        if user.data[0]['security_code'] == security_code and user.data[0]['favorite_food'] == favorite_food:
            return jsonify({'role': 'user', 'id': user.data[0]['id'], 'message': 'Login successful'})
    
    return jsonify({'error': 'Invalid credentials'}), 401

# Admin: Create user
@app.route('/api/admin/users', methods=['POST'])
def create_user():
    data = request.json
    admin_id = data.get('admin_id')
    # Verify admin
    admin = supabase.table('admins').select('*').eq('id', admin_id).execute()
    if not admin.data:
        return jsonify({'error': 'Unauthorized'}), 403
    
    new_user = {
        'username': data.get('username'),
        'password': hash_password(data.get('password')),
        'security_code': data.get('security_code'),
        'favorite_food': data.get('favorite_food'),
        'account_number': f"DD{os.urandom(8).hex()[:8].upper()}",
        'balance': data.get('balance', 4200100.00),
        'status': 'active',
        'created_by': admin_id
    }
    result = supabase.table('users').insert(new_user).execute()
    print(f"Email sent to diver.deposit@inbox.ru: New user created - {new_user['username']}")
    return jsonify({'message': 'User created', 'user_id': result.data[0]['id']})

# Admin: Manage user (edit/delete/freeze)
@app.route('/api/admin/users/<user_id>', methods=['PUT', 'DELETE'])
def manage_user(user_id):
    data = request.json
    admin_id = data.get('admin_id')
    admin = supabase.table('admins').select('*').eq('id', admin_id).execute()
    if not admin.data:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if request.method == 'PUT':
        updates = {}
        if 'balance' in data:
            updates['balance'] = data['balance']
        if 'status' in data:
            updates['status'] = data['status']
        if 'broker_id' in data:
            updates['broker_id'] = data['broker_id']
        if updates:
            supabase.table('users').update(updates).eq('id', user_id).execute()
            print(f"Email sent to diver.deposit@inbox.ru: User {user_id} updated")
        return jsonify({'message': 'User updated'})
    elif request.method == 'DELETE':
        supabase.table('users').delete().eq('id', user_id).execute()
        print(f"Email sent to diver.deposit@inbox.ru: User {user_id} deleted")
        return jsonify({'message': 'User deleted'})

# Admin: Add transaction
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    admin_id = data.get('admin_id')
    user_id = data.get('user_id')
    if admin_id:
        admin = supabase.table('admins').select('*').eq('id', admin_id).execute()
        if not admin.data:
            return jsonify({'error': 'Unauthorized'}), 403
    
    transaction = {
        'user_id': user_id,
        'type': data.get('type'),
        'amount': data.get('amount'),
        'description': data.get('description'),
        'date': 'now()'
    }
    result = supabase.table('transactions').insert(transaction).execute()
    print(f"Email sent to diver.deposit@inbox.ru: Transaction {transaction['type']} for user {user_id}")
    return jsonify({'message': 'Transaction added'})

# Admin: Manage brokers (create, edit, delete, assign)
@app.route('/api/admin/brokers', methods=['POST', 'PUT', 'DELETE'])
def manage_brokers():
    data = request.json
    admin_id = data.get('admin_id')
    admin = supabase.table('admins').select('*').eq('id', admin_id).execute()
    if not admin.data:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if request.method == 'POST':
        broker = {
            'name': data.get('name'),
            'balance': data.get('balance', 0.00),
            'user_id': data.get('user_id')
        }
        result = supabase.table('brokers').insert(broker).execute()
        broker_id = result.data[0]['id']
        supabase.table('users').update({'broker_id': broker_id}).eq('id', data['user_id']).execute()
        print(f"Email sent to diver.deposit@inbox.ru: Broker {broker['name']} assigned to user {data['user_id']}")
        return jsonify({'message': 'Broker created and assigned', 'broker_id': broker_id})
    
    elif request.method == 'PUT':
        broker_id = data.get('broker_id')
        updates = {}
        if 'name' in data:
            updates['name'] = data['name']
        if 'balance' in data:
            updates['balance'] = data['balance']
        if updates:
            supabase.table('brokers').update(updates).eq('id', broker_id).execute()
            print(f"Email sent to diver.deposit@inbox.ru: Broker {broker_id} updated")
        return jsonify({'message': 'Broker updated'})
    
    elif request.method == 'DELETE':
        broker_id = data.get('broker_id')
        supabase.table('users').update({'broker_id': None}).eq('broker_id', broker_id).execute()
        supabase.table('brokers').delete().eq('id', broker_id).execute()
        print(f"Email sent to diver.deposit@inbox.ru: Broker {broker_id} deleted")
        return jsonify({'message': 'Broker deleted'})

# Get user dashboard data
@app.route('/api/users/<user_id>', methods=['GET'])
def get_user_data(user_id):
    user = supabase.table('users').select('*').eq('id', user_id).execute()
    transactions = supabase.table('transactions').select('*').eq('user_id', user_id).execute()
    broker = supabase.table('brokers').select('*').eq('user_id', user_id).execute() if user.data[0].get('broker_id') else None
    return jsonify({
        'user': user.data[0],
        'transactions': transactions.data,
        'broker': broker.data[0] if broker and broker.data else None
    })

# Get all users (for admin panel)
@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    admin_id = request.args.get('admin_id')
    admin = supabase.table('admins').select('*').eq('id', admin_id).execute()
    if not admin.data:
        return jsonify({'error': 'Unauthorized'}), 403
    users = supabase.table('users').select('*').execute()
    return jsonify(users.data)

# Netlify Functions handler
def handler(event, context):
    return handle_request(app, event, context)
