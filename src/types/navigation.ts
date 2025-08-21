export type RootStackParamList = {
  Login: undefined;
  ProfileSetup: {
    email?: string;
    password?: string;
    isExistingUser?: boolean;
  };
  Home: undefined;
};
