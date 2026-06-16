import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "../../../../../models/user";
import connectMongoDb from "../../../../../lib/mongodb";

const authOptions = {
  providers: [  
    CredentialsProvider({
      name: 'credentials',
      credentials:{},
      async authorize(credentials) {
        const {email, password} = credentials ;
        await connectMongoDb();
        
        if(!email || !password) {
          throw new Error("Please fill all the fields");
        }
        const user = await User.findOne({email});
        if(!user) {
          throw new Error("User not found");
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }
        return user;
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',    
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id.toString();
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  }
};

export default authOptions;