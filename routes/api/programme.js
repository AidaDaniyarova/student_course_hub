// routes/api/programmes.js - Programmes API routes
import Programme from "../../models/programme.js";
import Interest from "../../models/interest.js";
import { validateProgramme, validateInterest } from "../../tools/validators.js";
import { sanitizeObject } from "../../tools/sanitise.js";

export async function handleGetProgrammes(request) {
  const url = new URL(request.url);
  const filters = {
    published: url.searchParams.get("published") === "1" ? 1 : undefined,
    level: url.searchParams.get("level"),
    search: url.searchParams.get("search")
  };
  
  const programmes = Programme.getAll(filters);
  
  return new Response(JSON.stringify({ programmes }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleGetProgramme(request, id) {
  const programme = Programme.getById(parseInt(id));
  
  if (!programme) {
    return new Response(JSON.stringify({ error: "Programme not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const modules = Programme.getModulesByYear(programme.id);
  const interestCount = Programme.getInterestCount(programme.id);
  const staff = Programme.getStaff(programme.id);
  
  return new Response(JSON.stringify({ 
    programme, 
    modules, 
    interestCount, 
    staff 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleCreateProgramme(request, user) {
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const body = await request.json();
  const validation = validateProgramme(body);
  
  if (!validation.isValid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const sanitized = sanitizeObject(body);
  const programme = Programme.create({
    ...sanitized,
    slug: sanitized.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    created_by: user.id
  });
  
  return new Response(JSON.stringify({ success: true, programme }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleUpdateProgramme(request, id, user) {
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const body = await request.json();
  const validation = validateProgramme(body);
  
  if (!validation.isValid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const sanitized = sanitizeObject(body);
  Programme.update(parseInt(id), sanitized);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleDeleteProgramme(request, id, user) {
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  Programme.delete(parseInt(id));
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleRegisterInterest(request) {
  const body = await request.json();
  const validation = validateInterest(body);
  
  if (!validation.isValid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const sanitized = sanitizeObject(body);
  const interest = Interest.register(sanitized);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Thank you for your interest! We'll be in touch soon.",
    interest 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}