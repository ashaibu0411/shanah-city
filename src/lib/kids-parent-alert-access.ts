import {getGroups} from "@/lib/group-server";
import {isMediaGroup,isUserInGroup} from "@/lib/media-group";
import {memberHasFullGroupAccess} from "@/lib/ministry-readiness-server";
import {canManageAsAdmin} from "@/lib/admin-access-server";
export async function canOperateKidsMedia(user:{id:string}|null){
 if(!user)return false;
 if(await canManageAsAdmin(user))return true;
 const groups=await getGroups();
 for(const group of groups){
  if(isMediaGroup(group)&&isUserInGroup(group,user.id)){
   const access=await memberHasFullGroupAccess(user.id,group.id);
   if(access.allowed)return true;
  }
 }
 return false;
}
