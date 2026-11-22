/** Exit warnings are local only. Never discard an uncertain operation silently. */
export function signOutWarning(pending:boolean, reviewed:boolean, minutes:string, note:string) {
 if(pending)return {title:'A save is still uncertain',message:'This entry may already be saved. Signing out discards its in-memory retry ID. Keep working and retry the same entry first. If you sign out anyway, check the original account on the website before creating another entry.'};
 if(reviewed || minutes.trim() || note.trim())return {title:'Discard this unsaved entry?',message:'Your time entry has not been saved. Signing out will clear its review, duration and note from this app.'};
 return null;
}
export function sameSession(expectedActor:string|null, expectedEpoch:number, actor:string|null, epoch:number) {
 return expectedActor!==null && expectedActor===actor && expectedEpoch===epoch;
}
