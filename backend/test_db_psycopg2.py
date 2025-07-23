import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="archon_dev",
        user="archon_user",
        password="archon_password"
    )
    print('✅ Connection successful!')
    
    cursor = conn.cursor()
    cursor.execute('SELECT 1')
    result = cursor.fetchone()
    print(f'✅ Query successful: {result[0]}')
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f'❌ Connection failed: {e}')
