from fastapi import APIRouter, HTTPException
import os
import time
import random
import asyncpg
import asyncio
import traceback
from app.auth import AuthorizedUser

# Router for endpoints
router = APIRouter()

# Database connection helper
async def get_db_connection():
    """Get database connection with logging"""
    try:
        start_time = time.time()
        print(f"🔌 Database: Attempting to connect...")

        db_url = os.getenv("DATABASE_URL_DEV")
        if not db_url:
            raise ValueError("DATABASE_URL_DEV not found in environment variables")
        conn = await asyncpg.connect(db_url)
        
        connect_time = (time.time() - start_time) * 1000
        print(f"✅ Database: Connected successfully in {connect_time:.2f}ms")
        
        return conn
    except Exception as e:
        print(f"❌ Database: Connection failed - {str(e)}")
        print(f"📊 Database: Full error traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Database connection failed")

# Mock analysis function with realistic simulation
async def run_mock_analysis(project_id: int, analysis_id: int):
    """Simulate running code analysis with realistic timing and logging"""
    print(f"🔬 Analysis: Starting mock analysis for project {project_id}, analysis {analysis_id}")
    
    conn = None
    try:
        # Simulate analysis phases
        phases = [
            ("Cloning repository", 2),
            ("Installing dependencies", 3),
            ("Running structure analysis", 2),
            ("Running quality checks", 2),
            ("Running security scan", 1),
            ("Analyzing dependencies", 1),
            ("Generating report", 1)
        ]
        
        total_expected = sum(duration for _, duration in phases)
        print(f"📊 Analysis: Expected total duration: {total_expected} seconds")
        
        # Update status to running
        conn = await get_db_connection()
        await conn.execute(
            "UPDATE analyses SET status = 'running' WHERE id = $1",
            analysis_id
        )
        print(f"📝 Analysis: Status updated to 'running'")
        await conn.close()
        
        # Simulate each phase
        for phase_name, duration in phases:
            print(f"⚙️ Analysis: {phase_name}...")
            await asyncio.sleep(duration)
            print(f"✅ Analysis: {phase_name} completed")
        
        # Generate realistic mock scores
        scores = {
            "structure_score": round(random.uniform(75, 95), 1),
            "quality_score": round(random.uniform(70, 90), 1),
            "security_score": round(random.uniform(80, 95), 1),
            "dependencies_score": round(random.uniform(85, 98), 1)
        }
        
        # Calculate weighted overall score
        overall_score = round(
            scores["structure_score"] * 0.4 +
            scores["quality_score"] * 0.3 +
            scores["security_score"] * 0.2 +
            scores["dependencies_score"] * 0.1,
            1
        )
        
        print(f"📊 Analysis: Generated scores - Overall: {overall_score}%, Structure: {scores['structure_score']}%, Quality: {scores['quality_score']}%, Security: {scores['security_score']}%, Dependencies: {scores['dependencies_score']}%")
        
        # Generate mock issues
        issues = [
            {
                "category": "Structure",
                "severity": "Medium",
                "title": "Large function detected",
                "description": "Function 'process_data' in main.py has 45 lines, consider breaking it down into smaller functions.",
                "file_path": "src/main.py",
                "line_number": 123
            },
            {
                "category": "Quality",
                "severity": "Low",
                "title": "Missing docstring",
                "description": "Function 'helper_function' is missing a docstring.",
                "file_path": "src/utils.py",
                "line_number": 67
            },
            {
                "category": "Security",
                "severity": "High",
                "title": "Potential SQL injection",
                "description": "String formatting used in SQL query, consider using parameterized queries.",
                "file_path": "src/database.py",
                "line_number": 89
            },
            {
                "category": "Dependencies",
                "severity": "Medium",
                "title": "Outdated dependency",
                "description": "Package 'requests' version 2.25.1 is outdated, latest is 2.31.0.",
                "file_path": "requirements.txt",
                "line_number": 5
            }
        ]
        
        print(f"🔍 Analysis: Generated {len(issues)} mock issues")
        
        # Update database with results
        conn = await get_db_connection()
        
        # Update analysis record
        await conn.execute(
            """
            UPDATE analyses SET 
                status = 'completed',
                completed_at = $1,
                overall_score = $2,
                structure_score = $3,
                quality_score = $4,
                security_score = $5,
                dependencies_score = $6
            WHERE id = $7
            """,
            datetime.now(),
            overall_score,
            scores["structure_score"],
            scores["quality_score"],
            scores["security_score"],
            scores["dependencies_score"],
            analysis_id
        )
        
        print(f"✅ Analysis: Updated analysis record {analysis_id}")
        
        # Insert issues
        for issue in issues:
            await conn.execute(
                """
                INSERT INTO issues (analysis_id, category, severity, title, description, file_path, line_number)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                analysis_id,
                issue["category"],
                issue["severity"],
                issue["title"],
                issue["description"],
                issue["file_path"],
                issue["line_number"]
            )
        
        print(f"✅ Analysis: Inserted {len(issues)} issues")
        
        # Update project's last_analysis_id
        await conn.execute(
            "UPDATE projects SET last_analysis_id = $1 WHERE id = $2",
            analysis_id,
            project_id
        )
        
        print(f"✅ Analysis: Updated project {project_id} last_analysis_id")
        
        await conn.close()
        
        print(f"🎉 Analysis: Mock analysis completed successfully for project {project_id}")
        
    except Exception as e:
        print(f"❌ Analysis: Error during mock analysis - {str(e)}")
        print(f"📊 Analysis: Full error traceback:")
        traceback.print_exc()
        
        # Update status to failed
        try:
            if not conn or conn.is_closed():
                conn = await get_db_connection()
            await conn.execute(
                "UPDATE analyses SET status = 'failed' WHERE id = $1",
                analysis_id
            )
            print(f"📝 Analysis: Status updated to 'failed'")
        except Exception as update_error:
            print(f"❌ Analysis: Failed to update status to 'failed' - {str(update_error)}")
        finally:
            if conn and not conn.is_closed():
                await conn.close()

@router.post("/projects/{project_id}/analyze")
async def start_analysis(project_id: int, user: AuthorizedUser):
    """Start code analysis for a project with comprehensive logging"""
    operation_start = time.time()
    user_id = user.sub
    
    print(f"🔬 API: POST /projects/{project_id}/analyze - Starting request for user {user_id} (type: {type(user_id)})")
    
    conn = None
    try:
        # Connect to database
        conn = await get_db_connection()
        
        # Convert string user_id to a consistent integer representation
        db_user_id = abs(hash(user_id)) % (2**31 - 1)  # Ensure positive 32-bit integer
        print(f"🔄 API: Converted user_id {user_id} to db_user_id {db_user_id}")
        
        # Verify project ownership
        verify_start = time.time()
        print(f"🔍 Database: Verifying project ownership")
        
        project = await conn.fetchrow(
            "SELECT id, repo_name, repo_owner FROM projects WHERE id = $1 AND user_id = $2",
            project_id, db_user_id
        )
        
        verify_time = (time.time() - verify_start) * 1000
        print(f"✅ Database: Project verification completed in {verify_time:.2f}ms")
        
        if not project:
            print(f"❌ API: Project {project_id} not found or not owned by user {user_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        print(f"📝 API: Verified project: {project['repo_owner']}/{project['repo_name']}")
        
        # Check for existing running analysis
        running_check_start = time.time()
        print(f"🔍 Database: Checking for existing running analysis")
        
        existing_analysis = await conn.fetchrow(
            "SELECT id, status FROM analyses WHERE project_id = $1 AND status IN ('pending', 'running') ORDER BY created_at DESC LIMIT 1",
            project_id
        )
        
        running_check_time = (time.time() - running_check_start) * 1000
        print(f"✅ Database: Running analysis check completed in {running_check_time:.2f}ms")
        
        if existing_analysis:
            print(f"⚠️ API: Analysis already in progress with ID {existing_analysis['id']}, status: {existing_analysis['status']}")
            raise HTTPException(
                status_code=409, 
                detail=f"Analysis already in progress (ID: {existing_analysis['id']})"
            )
        
        # Create new analysis record
        create_start = time.time()
        print(f"➕ Database: Creating new analysis record")
        
        analysis = await conn.fetchrow(
            """
            INSERT INTO analyses (project_id, status, created_at, overall_score, structure_score, quality_score, security_score, dependencies_score)
            VALUES ($1, 'pending', $2, 0, 0, 0, 0, 0)
            RETURNING id, status, created_at
            """,
            project_id, datetime.now()
        )
        
        create_time = (time.time() - create_start) * 1000
        total_time = (time.time() - operation_start) * 1000
        
        print(f"✅ Database: Analysis record created in {create_time:.2f}ms")
        print(f"🎉 API: POST /projects/{project_id}/analyze completed in {total_time:.2f}ms")
        print(f"📈 API: New analysis ID: {analysis['id']}")
        
        # Start background analysis
        print(f"🚀 Analysis: Starting background analysis task")
        asyncio.create_task(run_mock_analysis(project_id, analysis["id"]))
        
        await conn.close()
        
        return {
            "message": "Analysis started",
            "analysis_id": analysis["id"],
            "status": analysis["status"],
            "created_at": analysis["created_at"].isoformat(),
            "estimated_duration": "10-15 seconds"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (they're already logged above)
        raise
    except asyncpg.PostgresError as e:
        error_time = (time.time() - operation_start) * 1000
        print(f"❌ Database: PostgreSQL error after {error_time:.2f}ms - {str(e)}")
        print(f"📊 Database: Error code: {e.sqlstate}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        error_time = (time.time() - operation_start) * 1000
        print(f"❌ API: Unexpected error in POST /projects/{project_id}/analyze after {error_time:.2f}ms - {str(e)}")
        print(f"📊 API: Full error traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if conn and not conn.is_closed():
            await conn.close()
            print(f"🔌 Database: Connection closed")


