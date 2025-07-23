import asyncio
import asyncpg

async def test_connection():
    try:
        conn = await asyncpg.connect(
            host='127.0.0.1',
            port=5432,
            user='archon_user',
            password='archon_password',
            database='archon_dev',
            ssl='disable',
            command_timeout=60,
            server_settings={'application_name': 'archon_test'}
        )
        print('✅ Connection successful!')
        result = await conn.fetchval('SELECT 1')
        print(f'✅ Query successful: {result}')
        await conn.close()
    except Exception as e:
        print(f'❌ Connection failed: {e}')

if __name__ == "__main__":
    asyncio.run(test_connection())
