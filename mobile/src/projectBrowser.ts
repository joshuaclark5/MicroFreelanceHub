// UI-only filtering: this does not broaden the server's owner-scoped query.
export function filterProjects<T extends {name:string}>(projects:T[], query:string):T[] {
 const term=query.trim().toLocaleLowerCase();
 return term ? projects.filter(p=>p.name.toLocaleLowerCase().includes(term)) : projects;
}

// A late response must not replace a newer refresh or a different account.
export function createLoadGate() {
 let revision=0;
 return {
  begin() { const current=++revision; return {isCurrent:()=>current===revision}; },
  invalidate() { revision++; }
 };
}
