import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['POST', 'GET', 'HEAD'], origin: "*", credentials: true });

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => result instanceof Error ? reject(result) : resolve(result));
    });
}

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    if (req.method === "POST") {
        const { type, name, parentId } = req.body;
        if (!type || !name) {
            return res.status(400).json({ message: "Type and Name are required" });
        }
        try {
            let result;
            if (type === 'group') {
                result = await prisma.$queryRaw`
                    DECLARE @Msg NVARCHAR(255), @NId INT;
                    EXEC SP_Create_Group @GroupName = ${name}, @Message = @Msg OUTPUT, @NewId = @NId OUTPUT;
                    SELECT @Msg AS [Message], @NId AS [NewId];
                `;
            } else if (type === 'dept') {
                result = await prisma.$queryRaw`
                    DECLARE @Msg NVARCHAR(255), @NId INT;
                    EXEC SP_Create_Department @DeptName = ${name}, @GroupId = ${parseInt(parentId)}, @Message = @Msg OUTPUT, @NewId = @NId OUTPUT;
                    SELECT @Msg AS [Message], @NId AS [NewId];
                `;
            } else if (type === 'section') {
                result = await prisma.$queryRaw`
                    DECLARE @Msg NVARCHAR(255), @NId INT;
                    EXEC SP_Create_Section @SectionName = ${name}, @DeptId = ${parseInt(parentId)}, @Message = @Msg OUTPUT, @NewId = @NId OUTPUT;
                    SELECT @Msg AS [Message], @NId AS [NewId];
                `;
            } else if (type === 'team') {
                result = await prisma.$queryRaw`
                    DECLARE @Msg NVARCHAR(255), @NId INT;
                    EXEC SP_Create_Team @TeamName = ${name}, @SectionId = ${parseInt(parentId)}, @Message = @Msg OUTPUT, @NewId = @NId OUTPUT;
                    SELECT @Msg AS [Message], @NId AS [NewId];
                `;
            }

            const statusMsg = result?.[0]?.Message;
            const createdId = result?.[0]?.NewId;

            if (statusMsg === 'Success') {
                return res.status(200).json({ message: "Success", id: createdId, name });
            } else {
                return res.status(400).json({ message: statusMsg || "Action Failed" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal Error", error: error.message });
        }
    } else if (req.method === "GET") {
        const { action, page = 1, size = 100, search = '' } = req.query;
        try {
            if (action === 'options') {
                const options = await prisma.$queryRaw`EXEC SP_Get_Dropdown_Options;`;
                return res.status(200).json({ data: options });
            } else if (action === 'tree') {
                const treeData = await prisma.$queryRaw`EXEC SP_Get_Hierarchy_Tree @SearchTerm = ${search};`;
                return res.status(200).json({ data: treeData });
            } else if (action === 'groups') {
                const groups = await prisma.$queryRaw`EXEC SP_Get_Groups_Paged @PageNumber=${parseInt(page)}, @PageSize=${parseInt(size)}, @SearchTerm=${search};`;
                return res.status(200).json({ data: groups });
            } else if (action === 'departments') {
                const departments = await prisma.$queryRaw`EXEC SP_Get_Departments_Paged @PageNumber=${parseInt(page)}, @PageSize=${parseInt(size)}, @SearchTerm=${search};`;
                return res.status(200).json({ data: departments });
            } else if (action === 'sections') {
                const sections = await prisma.$queryRaw`EXEC SP_Get_Sections_Paged @PageNumber=${parseInt(page)}, @PageSize=${parseInt(size)}, @SearchTerm=${search};`;
                return res.status(200).json({ data: sections });
            } else if (action === 'teams') {
                const teams = await prisma.$queryRaw`EXEC SP_Get_Teams_Paged @PageNumber=${parseInt(page)}, @PageSize=${parseInt(size)}, @SearchTerm=${search};`;
                return res.status(200).json({ data: teams });
            } else {
                return res.status(400).json({ message: "Invalid action" });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}