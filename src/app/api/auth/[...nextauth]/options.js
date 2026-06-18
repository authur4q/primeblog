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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user._id.toString();
        token.name = user.name;
        token.username = user.username || "";
        token.isPremium = user.isPremium || false;
        token.role = user.role || "user";
        token.twitter = user.twitter || "";
        token.Instagram = user.Instagram || "";
        token.premiumUntil = user.premiumUntil ? user.premiumUntil.toISOString() : null;
      }
      
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.username = session.username !== undefined ? session.username : token.username;
        token.role = session.role || token.role;
        token.twitter = session.twitter !== undefined ? session.twitter : token.twitter;
        token.Instagram = session.Instagram !== undefined ? session.Instagram : token.Instagram;
        token.primaryPhone = session.primaryPhone !== undefined ? session.primaryPhone : token.primaryPhone; 
        
        try {
          await connectMongoDb();
          const dbUser = await User.findById(token.id).select("isPremium premiumUntil");
          if (dbUser) {
            token.isPremium = dbUser.isPremium;
            token.premiumUntil = dbUser.premiumUntil ? dbUser.premiumUntil.toISOString() : null;
          }
        } catch (error) {
          console.error("JWT update trigger verification database fallback error:", error);
        }
      } else {
        try {
          await connectMongoDb();
          const dbUser = await User.findById(token.id).select("isPremium premiumUntil");
          if (dbUser) {
            token.isPremium = dbUser.isPremium;
            token.premiumUntil = dbUser.premiumUntil ? dbUser.premiumUntil.toISOString() : null;
          }
        } catch (error) {
          console.error("JWT dynamic auto-refresh synchronization crash:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.isPremium = token.isPremium;
        session.user.role = token.role;
        session.user.twitter = token.twitter;
        session.user.Instagram = token.Instagram;
        session.user.primaryPhone = token.primaryPhone;
        session.user.premiumUntil = token.premiumUntil;

        if (session.user.isPremium) {
          try {
            await connectMongoDb();
            const dbUser = await User.findById(token.id);
            if (dbUser) {
              const today = new Date();
              if (dbUser.premiumUntil && today > new Date(dbUser.premiumUntil)) {
                await User.findByIdAndUpdate(token.id, {
                  $set: { isPremium: false, subscriptionPlan: "free" },
                  $unset: { premiumUntil: "" }
                });
                session.user.isPremium = false;
                token.isPremium = false;
                token.premiumUntil = null;
              }
            }
          } catch (error) {
            console.error("Subscription validation crash:", error);
          }
        }
      }
      return session;
    }
  }
};

export default authOptions;