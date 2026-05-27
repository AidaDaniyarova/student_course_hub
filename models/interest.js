// models/Interest.js
import { getDb } from "../config/database.js";

export class Interest {
  static db = getDb();
  
  static register(data) {
    const stmt = this.db.prepare(`
      INSERT INTO student_interests (name, email, phone, programme_id, message, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(data.name, data.email, data.phone, data.programme_id, data.message);
    return { id: result.lastInsertId };
  }
  
  static withdraw(id, email) {
    return this.db.prepare(`
      DELETE FROM student_interests WHERE id = ? AND email = ?
    `).run(id, email);
  }
  
  static getByEmail(email) {
    return this.db.prepare(`
      SELECT si.*, p.title as programme_title, p.level as programme_level
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE si.email = ?
      ORDER BY si.created_at DESC
    `).all(email);
  }
  
  static getAll(filters = {}) {
    let sql = `
      SELECT si.*, p.title as programme_title, p.level as programme_level
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.programme_id) {
      sql += " AND si.programme_id = ?";
      params.push(filters.programme_id);
    }
    if (filters.status) {
      sql += " AND si.status = ?";
      params.push(filters.status);
    }
    
    sql += " ORDER BY si.created_at DESC";
    return this.db.prepare(sql).all(...params);
  }
  
  static updateStatus(id, status) {
    return this.db.prepare(`
      UPDATE student_interests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);
  }
  
  static delete(id) {
    return this.db.prepare("DELETE FROM student_interests WHERE id = ?").run(id);
  }
  
  static getStats() {
    return this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT email) as unique_students,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN julianday('now') - julianday(created_at) <= 7 THEN 1 ELSE 0 END) as last_7_days
      FROM student_interests
    `).get();
  }
  
  static exportToCSV(programmeId = null) {
    const filters = programmeId ? { programme_id: programmeId } : {};
    const interests = this.getAll(filters);
    
    const headers = ["Name", "Email", "Phone", "Programme", "Level", "Status", "Registered", "Message"];
    const rows = interests.map(i => [
      i.name, i.email, i.phone || "", i.programme_title, i.programme_level,
      i.status, i.created_at, i.message || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    return csvContent;
  }
}