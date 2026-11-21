// models/staff.js
import { db } from "../server.js";

export class Staff {
  static getAll() {
    return db.prepare(`
      SELECT u.*, 
             COUNT(DISTINCT sp.programme_id) as programme_count,
             COUNT(DISTINCT m.id) as module_count
      FROM users u
      LEFT JOIN staff_programmes sp ON u.id = sp.staff_id
      LEFT JOIN modules m ON u.id = m.module_leader_id
      WHERE u.role IN ('admin', 'staff')
      GROUP BY u.id
      ORDER BY u.username
    `).all();
  }
  
  static getById(id) {
    return db.prepare(`
      SELECT u.*, 
             COUNT(DISTINCT sp.programme_id) as programme_count,
             COUNT(DISTINCT m.id) as module_count
      FROM users u
      LEFT JOIN staff_programmes sp ON u.id = sp.staff_id
      LEFT JOIN modules m ON u.id = m.module_leader_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(id);
  }
  
  static getProgrammes(staffId) {
    return db.prepare(`
      SELECT p.*, sp.role, sp.created_at as assigned_at
      FROM programmes p
      JOIN staff_programmes sp ON p.id = sp.programme_id
      WHERE sp.staff_id = ?
      ORDER BY p.level, p.title
    `).all(staffId);
  }
  
  static getModules(staffId) {
    return db.prepare(`
      SELECT * FROM modules 
      WHERE module_leader_id = ?
      ORDER BY year, code
    `).all(staffId);
  }
  
  static getTeachingLoad(staffId) {
    const programmes = this.getProgrammes(staffId);
    const modules = this.getModules(staffId);
    
    return {
      programmes: programmes.length,
      modules: modules.length,
      total_credits: modules.reduce((sum, m) => sum + (m.credits || 0), 0),
      programmes_list: programmes,
      modules_list: modules
    };
  }
  
  static assignToProgramme(staffId, programmeId, role = "lecturer") {
    try {
      return db.prepare(`
        INSERT INTO staff_programmes (staff_id, programme_id, role)
        VALUES (?, ?, ?)
      `).run(staffId, programmeId, role);
    } catch (error) {
      return null;
    }
  }
  
  static removeFromProgramme(staffId, programmeId) {
    return db.prepare(`
      DELETE FROM staff_programmes 
      WHERE staff_id = ? AND programme_id = ?
    `).run(staffId, programmeId);
  }
  
  static updateRole(staffId, programmeId, role) {
    return db.prepare(`
      UPDATE staff_programmes 
      SET role = ? 
      WHERE staff_id = ? AND programme_id = ?
    `).run(role, staffId, programmeId);
  }
  
  static createStaff(username, password, email) {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, 'staff')
    `);
    const result = stmt.run(username, password, email);
    return { id: result.lastInsertId };
  }
  
  static deleteStaff(id) {
    // First remove all assignments
    db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
    db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
    return db.prepare("DELETE FROM users WHERE id = ? AND role IN ('admin', 'staff')").run(id);
  }
}

export default Staff;