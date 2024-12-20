module.exports.config = {
    name: "help",
    version: "1.6.9",
    hasPermssion: 0,
    credits: "Nazrul",
    description: "Beginner's Guide",
    commandCategory: "system",
    usages: "",
    cooldowns: 1,
    envConfig: {
        autoUnsend: true,
        delayUnsend: 300
    }
};

module.exports.languages = {
    "en": {
        "moduleInfo": "✨ Module: %1\n📋 Description: %2\n\n📌 Command: %3\n⏳ Cooldown: %5 second(s)\n👥 Permission: %6\n📂 Category: %4\n💡 Credits: %7",
        "user": "User",
        "adminGroup": "Admin Group",
        "adminBot": "Admin Bot",
    }
};

module.exports.run = function({ api, event, args, getText }) {
    const { commands } = global.client;
    const { threadID, messageID } = event;
    const command = commands.get((args[0] || "").toLowerCase());
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
    const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

    if (!command) {
        const arrayInfo = [];
        const page = parseInt(args[0]) || 1;
        const numberOfOnePage = 8;
        let i = 0;
        let msg = "";

        for (let [name] of commands) {
            arrayInfo.push(name);
        }

        arrayInfo.sort((a, b) => a.localeCompare(b));

        const startSlice = numberOfOnePage * page - numberOfOnePage;
        i = startSlice;
        const returnArray = arrayInfo.slice(startSlice, startSlice + numberOfOnePage);

        const header = `🔹 Help Menu 🔹\n━━━━━━━━━━━━━━━\nPage (${page}/${Math.ceil(arrayInfo.length / numberOfOnePage)})\n━━━━━━━━━━━━━━━\n\n`;
        const footer = `━━━━━━━━━━━━━━━\n\n📌 Total Commands: ${arrayInfo.length}\n🛠️ Prefix: ${prefix}\n👑 Owner: ♡ A Y A N ♡\n\nUse: "${prefix}help <command>" for details.\n`;

        for (let item of returnArray) {
            msg += `🔸 ${++i}. ${prefix}${item}\n`;
        }

        return api.sendMessage(header + msg + footer, threadID, async (error, info) => {
            if (autoUnsend) {
                await new Promise(resolve => setTimeout(resolve, delayUnsend * 1000));
                return api.unsendMessage(info.messageID);
            } else return;
        }, messageID);
    }

    return api.sendMessage(getText("moduleInfo", command.config.name, command.config.description, `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, command.config.hasPermssion === 0 ? getText("user") : command.config.hasPermssion === 1 ? getText("adminGroup") : getText("adminBot"), command.config.credits), threadID, messageID);
};
