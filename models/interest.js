// models/interest.js - Student interest model
import { db } from "../server.js";

export class Interest {
  static register(data) {
    const stmt = db.prepare(`
      INSERT INTO student_interests (name, email, phone, programme_id, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name, data.email, data.phone, data.programme_id, data.message
    );
    return { id: result.lastInsertId };
  }
  
  static withdraw(id, email) {
    return db.prepare(`
      DELETE FROM student_interests 
      WHERE id = ? AND email = ?
    `).run(id, email);
  }
  
  static getByEmail(email) {
    return db.prepare(`
      SELECT si.*, p.title as programme_title, p.slug as programme_slug
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE si.email = ?
      ORDER BY si.created_at DESC
    `).all(email);
  }
  
  static getByProgramme(programmeId, status = null) {
    let sql = `
      SELECT si.*, 
             p.title as programme_title,
             CASE 
               WHEN si.created_at > datetime('now', '-30 days') THEN 'active'
               ELSE 'inactive'
             END as interest_status
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE si.programme_id = ?
    `;
    const params = [programmeId];
    
    if (status) {
      sql += " AND si.status = ?";
      params.push(status);
    }
    
    sql += " ORDER BY si.created_at DESC";
    
    return db.prepare(sql).all(...params);
  }
  
  static getAll(filters = {}) {
    let sql = `
      SELECT si.*, p.title as programme_title, p.level as programme_level
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      sql += " AND si.status = ?";
      params.push(filters.status);
    }
    
    if (filters.programme_id) {
      sql += " AND si.programme_id = ?";
      params.push(filters.programme_id);
    }
    
    if (filters.date_from) {
      sql += " AND si.created_at >= ?";
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += " AND si.created_at <= ?";
      params.push(filters.date_to);
    }
    
    sql += " ORDER BY si.created_at DESC";
    
    if (filters.limit) {
      sql += " LIMIT ?";
      params.push(filters.limit);
    }
    
    return db.prepare(sql).all(...params);
  }
  
  static getStats() {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_interests,
        COUNT(DISTINCT email) as unique_students,
        COUNT(DISTINCT programme_id) as programmes_with_interest,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN julianday('now') - julianday(created_at) <= 7 THEN 1 ELSE 0 END) as last_7_days
      FROM student_interests
    `).get();
  }
  
  static updateStatus(id, status) {
    return db.prepare(`
      UPDATE student_interests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);
  }
  
  static delete(id) {
    return db.prepare("DELETE FROM student_interests WHERE id = ?").run(id);
  }
  
  static exportToCSV(programmeId = null) {
    let interests;
    if (programmeId) {
      interests = this.getByProgramme(programmeId);
    } else {
      interests = this.getAll();
    }
    
    const headers = ["Name", "Email", "Phone", "Programme", "Status", "Registered Date"];
    const rows = interests.map(i => [
      i.name,
      i.email,
      i.phone || "",
      i.programme_title,
      i.status,
      new Date(i.created_at).toISOString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    return csvContent;
  }
}

export default Interest;