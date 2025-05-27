import IAMService from "../../lib/IAMService";

const AccessLevel = {
  DOB_ENCRYPT: "_tide_dob.selfencrypt",
  DOB_DECRYPT: "_tide_dob.selfdecrypt",
  CC_ENCRYPT: "_tide_cc.selfencrypt",
  CC_DECRYPT: "_tide_cc.selfdecrypt"
};

// Check if current authenticated user can decrypt DOB
export const canReadDOB = async () => {
    return await IAMService.hasOneRole(AccessLevel.DOB_DECRYPT);
}

// Check if current authenticated user can encrypt DOB
export const canWriteDOB = async () => {
    return await IAMService.hasOneRole(AccessLevel.DOB_ENCRYPT);
}

// Check if current authenticated user can decrypt CC
export const canReadCC = async () => {
    return await IAMService.hasOneRole(AccessLevel.CC_DECRYPT);
}

// Check if current authenticated user can encrypt CC
export const canWriteCC = async () => {
    return await IAMService.hasOneRole(AccessLevel.CC_ENCRYPT);
}