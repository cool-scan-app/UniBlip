import { db } from "./src/prisma/db";



async function main() {

    const usersToAdd = [
        {
            email: "bolex@uniblip.com",
            name: "Balexander",
        },
        {
            email: "julia@unblip.com",
            name: "Julia",
        },
        {
            email: "tobba@uniblip.com",
            name: "Tobias",
        },
        {
            email: "jesper@uniblip.com",
            name: "Jesper",
        },
    ];

    for (const user of usersToAdd) {
        const created = await db.orm.public.User.create({
        email: user.email,
        name: user.name,
        });
        console.log("Created:", created);
    }
    
    const users = await db.orm.public.User.all();
    console.log("All users:", users);

    await db.close();
}

main().catch((error) => {
  	console.error(error);
  	process.exit(1);
});